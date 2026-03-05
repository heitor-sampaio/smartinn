'use client'

import { useState, useMemo } from 'react'
import { format, addMonths, subMonths, parseISO, startOfMonth, endOfMonth, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, BedDouble, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MapaReservasMobileProps {
    reservas: any[]
    acomodacoes: any[]
    onReservaClick: (reservaId: string) => void
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
    PENDENTE: { label: 'Pendente', dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    CONFIRMADA: { label: 'Confirmada', dot: 'bg-blue-400', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
    CHECKIN_FEITO: { label: 'In-House', dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    CHECKOUT_FEITO: { label: 'Check-out', dot: 'bg-slate-300', badge: 'bg-slate-100 text-slate-700 border-slate-300' },
    CANCELADA: { label: 'Cancelada', dot: 'bg-red-400', badge: 'bg-red-100 text-red-800 border-red-300' },
}

export function MapaReservasMobile({ reservas, acomodacoes, onReservaClick }: MapaReservasMobileProps) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)

    // Reservas que cruzam o mês visualizado, excluindo canceladas
    const reservasDoMes = useMemo(() => {
        return reservas
            .filter(r => {
                if (r.status === 'CANCELADA') return false
                const ci = typeof r.dataCheckin === 'string' ? parseISO(r.dataCheckin) : r.dataCheckin
                const co = typeof r.dataCheckout === 'string' ? parseISO(r.dataCheckout) : r.dataCheckout
                return ci <= monthEnd && co >= monthStart
            })
            .sort((a, b) => {
                const aDate = typeof a.dataCheckin === 'string' ? parseISO(a.dataCheckin) : a.dataCheckin
                const bDate = typeof b.dataCheckin === 'string' ? parseISO(b.dataCheckin) : b.dataCheckin
                return aDate.getTime() - bDate.getTime()
            })
    }, [reservas, monthStart, monthEnd])

    // Agrupa por status para ordenar: in-house → confirmada → pendente → checkout
    const ordem = ['CHECKIN_FEITO', 'CONFIRMADA', 'PENDENTE', 'CHECKOUT_FEITO']
    const agrupado = ordem
        .map(status => ({
            status,
            items: reservasDoMes.filter(r => r.status === status),
        }))
        .filter(g => g.items.length > 0)

    return (
        <div className="space-y-4">
            {/* Cabeçalho com navegação de mês */}
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Ocupação
                </h3>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline" size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium capitalize w-28 text-center">
                        {format(currentDate, 'MMM yyyy', { locale: ptBR })}
                    </span>
                    <Button
                        variant="outline" size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Legenda compacta */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {ordem.map(s => (
                    <div key={s} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                        {STATUS_CONFIG[s].label}
                    </div>
                ))}
            </div>

            {/* Lista de reservas agrupadas por status */}
            {reservasDoMes.length === 0 ? (
                <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
                    Nenhuma reserva ativa em{' '}
                    {format(currentDate, 'MMMM', { locale: ptBR })}.
                </div>
            ) : (
                <div className="space-y-4">
                    {agrupado.map(grupo => {
                        const cfg = STATUS_CONFIG[grupo.status]
                        return (
                            <div key={grupo.status}>
                                {/* Label do grupo */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {cfg.label} · {grupo.items.length}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {grupo.items.map(reserva => {
                                        const ci = typeof reserva.dataCheckin === 'string' ? parseISO(reserva.dataCheckin) : reserva.dataCheckin
                                        const co = typeof reserva.dataCheckout === 'string' ? parseISO(reserva.dataCheckout) : reserva.dataCheckout
                                        const noites = differenceInCalendarDays(co, ci)
                                        const acomodacao = acomodacoes.find(a => a.id === reserva.acomodacaoId)

                                        return (
                                            <div
                                                key={reserva.id}
                                                className="rounded-lg border bg-card p-3 flex gap-3 active:scale-[0.98] cursor-pointer transition-transform"
                                                onClick={() => onReservaClick(reserva.id)}
                                            >
                                                {/* Barra lateral colorida */}
                                                <div className={`w-1 rounded-full shrink-0 self-stretch ${cfg.dot}`} />

                                                <div className="flex-1 min-w-0">
                                                    {/* Nome do hóspede + badge */}
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <p className="font-semibold text-sm truncate leading-tight">
                                                            {reserva.hospede?.nome || '—'}
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] shrink-0 px-1.5 py-0 border ${cfg.badge}`}
                                                        >
                                                            {cfg.label}
                                                        </Badge>
                                                    </div>

                                                    {/* Quarto */}
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <BedDouble className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{acomodacao?.nome || '—'}</span>
                                                    </div>

                                                    {/* Datas e noites */}
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                        <Clock className="h-3 w-3 shrink-0" />
                                                        <span>
                                                            {format(ci, 'dd/MM')} → {format(co, 'dd/MM')}
                                                        </span>
                                                        <span className="text-muted-foreground/50">·</span>
                                                        <span>{noites} noite{noites !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
