'use client';

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReservaForm } from './reserva-form'
import { ConsumoModal } from './consumo-modal'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Copy, DoorOpen, Link2, Loader2, ThumbsUp, Trash2, UserX } from 'lucide-react'
import { deleteExtraReserva } from '@/actions/reservas'
import { gerarTokenCheckin } from '@/actions/checkin-virtual'
import { toast } from 'sonner'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export function ReservaDetalhesModal({
    reserva,
    hospedesList,
    acomodacoesList,
    produtosList,
    onConfirmar,
    onCheckin,
    onCheckout,
    onCancelReserva,
    onNoShow
}: any) {

    const subtotalConsumo = reserva?.extras?.reduce((acc: number, curr: any) => acc + (curr.valor * curr.quantidade), 0) || 0
    const valorOriginal = reserva?.valorTotal || 0
    const subtotalGeral = valorOriginal + subtotalConsumo

    const [checkInToken, setCheckInToken] = useState<string | null>(reserva?.checkInToken ?? null)
    const [gerandoToken, setGerandoToken] = useState(false)

    const checkinUrl = checkInToken
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/check-in/${checkInToken}`
        : null

    const handleCopiarLink = () => {
        if (!checkinUrl) return
        navigator.clipboard.writeText(checkinUrl)
        toast.success('Link copiado para a área de transferência!')
    }

    const handleGerarToken = async () => {
        setGerandoToken(true)
        const result = await gerarTokenCheckin(reserva.id)
        setGerandoToken(false)
        if (result.error) {
            toast.error(result.error)
        } else if (result.token) {
            setCheckInToken(result.token)
            toast.success('Link de check-in gerado!')
        }
    }

    const handleDeleteConsumo = async (extraId: string) => {
        if (!confirm('Deseja realmente remover este item do consumo? Isso devolverá produtos ao estoque se aplicável.')) return;
        const p = deleteExtraReserva(extraId);
        toast.promise(p, {
            loading: 'Removendo consumo...',
            success: (res) => {
                if (res.error) throw new Error(res.error);
                return res.success || 'Item removido com sucesso.';
            },
            error: (e) => e.message
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDENTE': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">Pendente / Orçamento</Badge>
            case 'CONFIRMADA': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">Confirmada</Badge>
            case 'CHECKIN_FEITO': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300">Alojado (In-House)</Badge>
            case 'CHECKOUT_FEITO': return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300">Concluída</Badge>
            case 'CANCELADA': return <Badge variant="destructive">Cancelada</Badge>
            case 'NO_SHOW': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300">No Show</Badge>
            default: return <Badge>{status}</Badge>
        }
    }

    return (
        <Tabs defaultValue="resumo" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="resumo">Resumo da Reserva</TabsTrigger>
                <TabsTrigger value="consumo">Consumo do Hóspede</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-6">
                <div className="bg-muted/30 border rounded-lg p-4 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-primary">{reserva.hospede.nome}</h3>
                            <p className="text-sm text-muted-foreground mt-1">CPF: {reserva.hospede.cpf || '—'} | Tel: {reserva.hospede.telefone || '—'}</p>
                        </div>
                        <div>
                            {getStatusBadge(reserva.status)}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-4 p-4 bg-background border rounded-md">
                        <div>
                            <p className="text-muted-foreground flex items-center mb-1">Acomodação</p>
                            <p className="font-semibold">{reserva.acomodacao.nome}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground flex items-center mb-1">Hóspedes (Pax)</p>
                            <p className="font-semibold">{reserva.totalHospedes} pessoas</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground flex items-center mb-1">Check-in</p>
                            <p className="font-semibold">{format(new Date(reserva.dataCheckin), "dd 'de' MMM, yyyy", { locale: ptBR })}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground flex items-center mb-1">Check-out</p>
                            <p className="font-semibold">{format(new Date(reserva.dataCheckout), "dd 'de' MMM, yyyy", { locale: ptBR })}</p>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4 flex flex-col sm:flex-row justify-between items-center bg-card p-4 rounded-md shadow-sm">
                        <div className="mb-2 sm:mb-0">
                            <p className="text-sm text-muted-foreground">Valor das Diárias Fechado:</p>
                            <p className="font-semibold text-lg">R$ {valorOriginal.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="text-right bg-primary/5 p-3 rounded-lg border border-primary/20">
                            <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Total a Pagar (Diárias + Consumo)</p>
                            <p className="text-3xl font-black text-primary">R$ {subtotalGeral.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                </div>

                {(reserva.status === 'PENDENTE' || reserva.status === 'CONFIRMADA') && (
                    <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                        <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold text-sm">Check-in Virtual</h4>
                        </div>
                        {checkinUrl ? (
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Envie este link ao hóspede para preencher os dados remotamente.</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-background border rounded px-3 py-2 text-xs text-foreground truncate">
                                        {checkinUrl}
                                    </code>
                                    <Button size="sm" variant="outline" onClick={handleCopiarLink} className="shrink-0">
                                        <Copy className="h-4 w-4 mr-1" /> Copiar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Gere um link para o hóspede preencher os dados antes de chegar.</p>
                                <Button size="sm" variant="outline" onClick={handleGerarToken} disabled={gerandoToken}>
                                    {gerandoToken ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Link2 className="h-4 w-4 mr-1" />}
                                    Gerar link de check-in
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap gap-2 justify-end mt-4">
                    {reserva.status === 'PENDENTE' && (
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onConfirmar(reserva.id)}>
                            <ThumbsUp className="mr-2 h-4 w-4" /> Aprovar Orçamento (Confirmar)
                        </Button>
                    )}
                    {reserva.status === 'CONFIRMADA' && (
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onCheckin(reserva.id)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Fazer Check-in (Entrada)
                        </Button>
                    )}
                    {reserva.status === 'CHECKIN_FEITO' && (
                        <Button className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => onCheckout(reserva.id)}>
                            <DoorOpen className="mr-2 h-4 w-4" /> Checkout
                        </Button>
                    )}
                    {(reserva.status === 'CONFIRMADA' || reserva.status === 'PENDENTE') && (
                        <Button variant="ghost" className="text-orange-600 hover:bg-orange-50 hover:text-orange-700" onClick={() => onNoShow(reserva.id)}>
                            <UserX className="mr-2 h-4 w-4" /> No Show
                        </Button>
                    )}
                    {(reserva.status === 'CONFIRMADA' || reserva.status === 'PENDENTE') && (
                        <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onCancelReserva(reserva.id)}>
                            Cancelar Reserva
                        </Button>
                    )}
                </div>

                <Accordion type="single" collapsible className="w-full mt-4 border-t">
                    <AccordionItem value="edit" className="border-none">
                        <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline hover:text-foreground">
                            Editar parâmetros da reserva (Datas, Acomodação, Valores)...
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                            <ReservaForm
                                initialData={reserva}
                                hospedesList={hospedesList}
                                acomodacoesList={acomodacoesList}
                                onSuccess={() => { }}
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </TabsContent>

            <TabsContent value="consumo" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[400px]">
                    {/* Left Side: Formulário */}
                    <div className="border rounded-lg p-4 bg-muted/10 h-fit">
                        <h4 className="font-semibold mb-4 text-primary">Inserir Consumo</h4>
                        {reserva.status !== 'CHECKIN_FEITO' && (
                            <div className="text-xs text-amber-700 bg-amber-100 p-2 rounded mb-4 border border-amber-200">
                                Atenção: O hóspede ainda não fez Check-in.
                            </div>
                        )}
                        <ConsumoModal
                            reservaId={reserva.id}
                            produtosList={produtosList}
                            onSuccess={() => { }}
                            onCancel={() => { }}
                        />
                    </div>

                    {/* Right Side: Lista */}
                    <div className="border rounded-lg p-0 bg-card overflow-hidden flex flex-col h-full max-h-[500px]">
                        <div className="bg-muted/30 p-4 border-b flex justify-between items-center sticky top-0">
                            <h4 className="font-semibold text-sm">Extrato de consumo</h4>
                            <Badge variant="outline" className="font-mono bg-background text-sm font-bold shadow-sm">
                                R$ {subtotalConsumo.toFixed(2).replace('.', ',')}
                            </Badge>
                        </div>
                        <div className="overflow-y-auto p-3 space-y-2 flex-1">
                            {(!reserva.extras || reserva.extras.length === 0) ? (
                                <div className="text-center p-8 text-muted-foreground text-sm border-2 border-dashed rounded-md h-full flex items-center justify-center">
                                    <span>Nenhum consumo registrado<br />para esta reserva.</span>
                                </div>
                            ) : (
                                reserva.extras.map((extra: any) => (
                                    <div key={extra.id} className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-md border text-sm group transition-colors bg-background shadow-sm">
                                        <div>
                                            <div className="font-semibold text-foreground">{extra.descricao || 'Item sem nome'}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {format(new Date(extra.criadoEm), "dd/MM 'às' HH:mm")} • {extra.quantidade}x R$ {extra.valor.toFixed(2).replace('.', ',')}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="font-bold text-foreground">
                                                R$ {(extra.valor * extra.quantidade).toFixed(2).replace('.', ',')}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 opacity-50 hover:opacity-100 hover:bg-red-50 transition-all pointer-events-auto"
                                                onClick={() => handleDeleteConsumo(extra.id)}
                                                title="Deletar Item (+ Estorno)"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    )
}
