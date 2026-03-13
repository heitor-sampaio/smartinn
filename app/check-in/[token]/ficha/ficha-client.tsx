'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { solicitarLimpeza, confirmarLimpeza } from '@/actions/checkin-virtual'
import { createClient } from '@/utils/supabase/client'
import { format, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Hotel, BedDouble, CalendarDays, Users, Receipt, Sparkles, CheckCircle2, Clock, Loader2, Wifi, Phone } from 'lucide-react'

interface Extra {
    id: string
    descricao: string
    valor: number
    quantidade: number
}

interface Reserva {
    id: string
    pousadaId: string
    status: string
    dataCheckin: string
    dataCheckout: string
    totalHospedes: number
    valorTotal: number
    acomodacao: { nome: string; tipo: string }
    pousada: { nome: string; logoUrl: string | null; ramalRecepcao: string | null; nomeWifi: string | null; senhaWifi: string | null }
    hospedeNome: string
    extras: Extra[]
    tarefaLimpeza: { id: string; status: string; concluidaEm: string | null } | null
}

interface Props {
    token: string
    reserva: Reserva
}

const STATUS_LABEL: Record<string, string> = {
    PENDENTE: 'Pendente',
    CONFIRMADA: 'Confirmada',
    CHECKIN_FEITO: 'Hospedado',
    CHECKOUT_FEITO: 'Encerrada',
}

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function FichaClient({ token, reserva }: Props) {
    const [limpezaSolicitada, setLimpezaSolicitada] = useState(false)
    const [loading, setLoading] = useState(false)
    const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const supabase = createClient()

        const channel = supabase.channel(`pousada-${reserva.pousadaId}`)
            .on('broadcast', { event: 'change' }, () => { router.refresh() })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [reserva.pousadaId, router])

    const checkin = new Date(reserva.dataCheckin)
    const checkout = new Date(reserva.dataCheckout)
    const noites = differenceInCalendarDays(checkout, checkin)

    const totalExtras = reserva.extras.reduce((sum, e) => sum + e.valor * e.quantidade, 0)

    const handleConfirmarLimpeza = async () => {
        setConfirmandoLimpeza(true)
        const result = await confirmarLimpeza(token)
        setConfirmandoLimpeza(false)
        if (result.error) {
            toast.error(result.error)
        } else {
            setLimpezaSolicitada(false)
            router.refresh()
        }
    }

    const handleSolicitarLimpeza = async () => {
        setLoading(true)
        const result = await solicitarLimpeza(token)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else if (result.already) {
            toast.info('Já existe uma solicitação de limpeza em andamento para este quarto.')
            setLimpezaSolicitada(true)
        } else {
            toast.success('Solicitação enviada! A equipe será avisada.')
            setLimpezaSolicitada(true)
        }
    }

    return (
        <div className="min-h-screen bg-muted/30 py-8 px-4">
            <div className="max-w-lg mx-auto space-y-4">

                {/* Header da pousada */}
                <div className="bg-white rounded-xl shadow-sm p-5 text-center space-y-1">
                    <div className="flex justify-center mb-2">
                        {reserva.pousada.logoUrl ? (
                            <img src={reserva.pousada.logoUrl} alt={reserva.pousada.nome} className="h-10 w-auto object-contain" />
                        ) : (
                            <Hotel className="h-8 w-8 text-primary" />
                        )}
                    </div>
                    <h1 className="text-lg font-bold text-gray-900">{reserva.pousada.nome}</h1>
                    <p className="text-sm text-muted-foreground">Ficha de Reserva</p>

                </div>

                {/* Informações rápidas da estadia */}
                {(reserva.pousada.ramalRecepcao || reserva.pousada.nomeWifi) && (
                    <div className={`grid gap-3 ${reserva.pousada.ramalRecepcao && reserva.pousada.nomeWifi ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {reserva.pousada.ramalRecepcao && (
                            <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Phone className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Recepção</p>
                                    <p className="font-bold text-base leading-tight">{reserva.pousada.ramalRecepcao}</p>
                                </div>
                            </div>
                        )}
                        {reserva.pousada.nomeWifi && (
                            <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Wifi className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">Wi-Fi</p>
                                    <p className="font-bold text-sm leading-tight truncate">{reserva.pousada.nomeWifi}</p>
                                    {reserva.pousada.senhaWifi && (
                                        <p className="text-xs text-muted-foreground font-mono leading-tight">{reserva.pousada.senhaWifi}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Resumo da reserva */}
                <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BedDouble className="h-4 w-4 text-muted-foreground" />
                            <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Sua Reserva</h2>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            reserva.status === 'CHECKIN_FEITO'
                                ? 'bg-emerald-100 text-emerald-700'
                                : reserva.status === 'CHECKOUT_FEITO'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-blue-100 text-blue-700'
                        }`}>
                            {STATUS_LABEL[reserva.status] ?? reserva.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start gap-2">
                            <BedDouble className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-muted-foreground text-xs">Acomodação</p>
                                <p className="font-semibold">{reserva.acomodacao.nome}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-muted-foreground text-xs">Hóspedes</p>
                                <p className="font-semibold">{reserva.totalHospedes} pessoa{reserva.totalHospedes > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-muted-foreground text-xs">Check-in</p>
                                <p className="font-semibold">{format(checkin, "dd/MM/yyyy", { locale: ptBR })}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-muted-foreground text-xs">Check-out</p>
                                <p className="font-semibold">{format(checkout, "dd/MM/yyyy", { locale: ptBR })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-3 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{noites} noite{noites > 1 ? 's' : ''} de hospedagem</span>
                        <span className="font-bold text-base">{fmt(reserva.valorTotal)}</span>
                    </div>
                </div>

                {/* Limpeza — só aparece quando em hospedagem */}
                {reserva.status === 'CHECKIN_FEITO' && (
                    <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                            <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Limpeza</h2>
                        </div>

                        {/* CONCLUÍDA */}
                        {reserva.tarefaLimpeza?.status === 'CONCLUIDA' && (
                            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-700">Quarto limpo e pronto!</p>
                                        <p className="text-xs text-emerald-600 mt-0.5">
                                            {reserva.tarefaLimpeza?.concluidaEm
                                                ? `Concluída em ${format(new Date(reserva.tarefaLimpeza.concluidaEm), "dd/MM 'às' HH:mm", { locale: ptBR })}`
                                                : 'A limpeza foi concluída. Pode voltar ao seu quarto.'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleConfirmarLimpeza}
                                    disabled={confirmandoLimpeza}
                                    size="sm"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    {confirmandoLimpeza ? 'Confirmando...' : 'OK, quarto vistoriado!'}
                                </Button>
                            </div>
                        )}

                        {/* EM ANDAMENTO */}
                        {reserva.tarefaLimpeza?.status === 'EM_ANDAMENTO' && (
                            <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                                <Loader2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-700">Limpeza em andamento</p>
                                    <p className="text-xs text-blue-600 mt-0.5">Nossa equipe está cuidando do seu quarto agora.</p>
                                </div>
                            </div>
                        )}

                        {/* PENDENTE (ou optimistic após click) */}
                        {(reserva.tarefaLimpeza?.status === 'PENDENTE' || (!reserva.tarefaLimpeza && limpezaSolicitada)) && (
                            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                                <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-700">Solicitação recebida</p>
                                    <p className="text-xs text-amber-600 mt-0.5">A equipe será avisada e realizará a limpeza em breve.</p>
                                </div>
                            </div>
                        )}

                        {/* SEM SOLICITAÇÃO — mostra botão */}
                        {!reserva.tarefaLimpeza && !limpezaSolicitada && (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Precisa que a equipe limpe o quarto? Avise-nos quando estiver fora.
                                </p>
                                <Button
                                    onClick={handleSolicitarLimpeza}
                                    disabled={loading}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    {loading ? 'Enviando...' : 'Quarto liberado para limpeza'}
                                </Button>
                            </>
                        )}
                    </div>
                )}

                {/* Consumação */}
                <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                    <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Consumação</h2>
                    </div>

                    {reserva.extras.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum item registrado.</p>
                    ) : (
                        <>
                            <ul className="space-y-2">
                                {reserva.extras.map(e => (
                                    <li key={e.id} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700">
                                            {e.descricao}
                                            {e.quantidade > 1 && (
                                                <span className="text-muted-foreground ml-1">× {e.quantidade}</span>
                                            )}
                                        </span>
                                        <span className="font-medium">{fmt(e.valor * e.quantidade)}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t pt-2 flex items-center justify-between text-sm font-semibold">
                                <span>Total extras</span>
                                <span>{fmt(totalExtras)}</span>
                            </div>
                        </>
                    )}
                </div>

                <p className="text-center text-xs text-muted-foreground pb-4">
                    Dúvidas? Fale com a recepção da {reserva.pousada.nome}.
                </p>
            </div>
        </div>
    )
}
