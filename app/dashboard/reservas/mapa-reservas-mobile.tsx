'use client'

import { useState, useMemo } from 'react'
import { format, addMonths, subMonths, addDays, startOfWeek, parseISO, startOfMonth, endOfMonth, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, BedDouble, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ViewPeriod = 'semana' | 'quinzena' | 'mes'

const PERIOD_CONFIG: Record<ViewPeriod, { label: string }> = {
    semana:   { label: 'Semana'  },
    quinzena: { label: '15 dias' },
    mes:      { label: 'Mês'     },
}

interface MapaReservasMobileProps {
    reservas: any[]
    acomodacoes: any[]
    onReservaClick: (reservaId: string) => void
}

const STATUS_CONFIG: Record<string, { label: string; accent: string; bg: string; text: string; dot: string }> = {
    PENDENTE:       { label: 'Pendente',   accent: '#d97706', bg: 'bg-amber-200   dark:bg-amber-700/80',      text: 'text-amber-900  dark:text-amber-50',  dot: 'bg-amber-500' },
    CONFIRMADA:     { label: 'Confirmada', accent: '#2563eb', bg: 'bg-blue-200    dark:bg-blue-700/80',        text: 'text-blue-900   dark:text-blue-50',   dot: 'bg-blue-500' },
    CHECKIN_FEITO:  { label: 'In-House',   accent: '#059669', bg: 'bg-emerald-200 dark:bg-emerald-700/80',     text: 'text-emerald-900 dark:text-emerald-50', dot: 'bg-emerald-500' },
    CHECKOUT_FEITO: { label: 'Concluída',  accent: '#64748b', bg: 'bg-slate-200   dark:bg-slate-600/80',       text: 'text-slate-700  dark:text-slate-100',  dot: 'bg-slate-400' },
    CANCELADA:      { label: 'Cancelada',  accent: '#dc2626', bg: 'bg-red-200     dark:bg-red-700/80',         text: 'text-red-900    dark:text-red-50',     dot: 'bg-red-500' },
    NO_SHOW:        { label: 'No-Show',    accent: '#b91c1c', bg: 'bg-red-300     dark:bg-red-800/80',         text: 'text-red-950    dark:text-red-50',     dot: 'bg-red-700' },
}

const ORDEM = ['CHECKIN_FEITO', 'CONFIRMADA', 'PENDENTE', 'CHECKOUT_FEITO', 'NO_SHOW'] as const

export function MapaReservasMobile({ reservas, acomodacoes, onReservaClick }: MapaReservasMobileProps) {
    const [period, setPeriod] = useState<ViewPeriod>('mes')
    const [rangeStart, setRangeStart] = useState(() => startOfMonth(new Date()))

    const { viewStart, viewEnd } = useMemo(() => {
        if (period === 'mes') return { viewStart: startOfMonth(rangeStart), viewEnd: endOfMonth(rangeStart) }
        const count = period === 'semana' ? 7 : 15
        return { viewStart: rangeStart, viewEnd: addDays(rangeStart, count - 1) }
    }, [period, rangeStart])

    const headerLabel = useMemo(() => {
        if (period === 'mes') return format(rangeStart, 'MMM yyyy', { locale: ptBR })
        const sameMonth = viewStart.getMonth() === viewEnd.getMonth() && viewStart.getFullYear() === viewEnd.getFullYear()
        if (sameMonth) return `${format(viewStart, 'd')} – ${format(viewEnd, "d MMM", { locale: ptBR })}`
        return `${format(viewStart, "d MMM", { locale: ptBR })} – ${format(viewEnd, "d MMM", { locale: ptBR })}`
    }, [period, rangeStart, viewStart, viewEnd])

    function navigate(dir: 1 | -1) {
        if (period === 'semana')        setRangeStart(d => addDays(d, dir * 7))
        else if (period === 'quinzena') setRangeStart(d => addDays(d, dir * 15))
        else                            setRangeStart(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1))
    }

    function handlePeriodChange(p: ViewPeriod) {
        setPeriod(p)
        if (p === 'mes')         setRangeStart(startOfMonth(rangeStart))
        else if (p === 'semana') setRangeStart(startOfWeek(rangeStart, { weekStartsOn: 0 }))
    }

    const reservasDoPeriodo = useMemo(() => {
        return reservas
            .filter(r => {
                if (r.status === 'CANCELADA') return false
                const ci = typeof r.dataCheckin  === 'string' ? parseISO(r.dataCheckin)  : r.dataCheckin
                const co = typeof r.dataCheckout === 'string' ? parseISO(r.dataCheckout) : r.dataCheckout
                return ci <= viewEnd && co >= viewStart
            })
            .sort((a, b) => {
                const aDate = typeof a.dataCheckin === 'string' ? parseISO(a.dataCheckin) : a.dataCheckin
                const bDate = typeof b.dataCheckin === 'string' ? parseISO(b.dataCheckin) : b.dataCheckin
                return aDate.getTime() - bDate.getTime()
            })
    }, [reservas, viewStart, viewEnd])

    const agrupado = ORDEM
        .map(status => ({ status, items: reservasDoPeriodo.filter(r => r.status === status) }))
        .filter(g => g.items.length > 0)

    return (
        <div className="space-y-4">
            {/* Cabeçalho — 2 linhas */}
            <div className="space-y-2">
                {/* Linha 1: título + seletor de período */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                        <CalendarDays className="h-4 w-4" />
                        Ocupação
                    </div>
                    <div className="flex rounded-lg border overflow-hidden text-xs">
                        {(['semana', 'quinzena', 'mes'] as ViewPeriod[]).map(p => (
                            <button
                                key={p}
                                onClick={() => handlePeriodChange(p)}
                                className={`px-3 py-1.5 font-medium transition-colors border-r last:border-r-0
                                    ${period === p
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background text-muted-foreground hover:bg-muted/60'
                                    }`}
                            >
                                {PERIOD_CONFIG[p].label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Linha 2: navegação de ciclo */}
                <div className="flex items-center justify-between">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold capitalize select-none">
                        {headerLabel}
                    </span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Legenda compacta */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {ORDEM.map(s => (
                    <div key={s} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_CONFIG[s].dot}`} />
                        {STATUS_CONFIG[s].label}
                    </div>
                ))}
            </div>

            {/* Lista agrupada */}
            {reservasDoPeriodo.length === 0 ? (
                <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                    Nenhuma reserva ativa em{' '}
                    <span className="font-medium capitalize">{headerLabel}</span>.
                </div>
            ) : (
                <div className="space-y-5">
                    {agrupado.map(grupo => {
                        const cfg = STATUS_CONFIG[grupo.status]
                        return (
                            <div key={grupo.status} className="space-y-2">
                                {/* Separador de grupo */}
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                        {cfg.label}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground/60 font-medium">
                                        · {grupo.items.length}
                                    </span>
                                    <div className="flex-1 h-px bg-border/60" />
                                </div>

                                {/* Cards */}
                                {grupo.items.map(reserva => {
                                    const ci  = typeof reserva.dataCheckin  === 'string' ? parseISO(reserva.dataCheckin)  : reserva.dataCheckin
                                    const co  = typeof reserva.dataCheckout === 'string' ? parseISO(reserva.dataCheckout) : reserva.dataCheckout
                                    const noites = differenceInCalendarDays(co, ci)
                                    const acomodacao = acomodacoes.find(a => a.id === reserva.acomodacaoId)
                                    const valor = Number(reserva.valorTotal || 0)

                                    return (
                                        <div
                                            key={reserva.id}
                                            className={`rounded-xl border overflow-hidden flex cursor-pointer active:scale-[0.98] transition-transform shadow-sm ${cfg.bg}`}
                                            onClick={() => onReservaClick(reserva.id)}
                                        >
                                            {/* Faixa lateral colorida */}
                                            <div className="w-1 shrink-0 self-stretch" style={{ background: cfg.accent }} />

                                            <div className="flex-1 min-w-0 px-3 py-2.5 space-y-1.5">
                                                {/* Linha 1: nome + valor */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`font-semibold text-sm leading-tight truncate ${cfg.text}`}>
                                                        {reserva.hospede?.nome || '—'}
                                                    </p>
                                                    {valor > 0 && (
                                                        <span className={`text-xs font-bold shrink-0 ${cfg.text}`}>
                                                            R$ {valor.toFixed(2).replace('.', ',')}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Linha 2: quarto + datas + noites */}
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        <BedDouble className="h-3 w-3" />
                                                        <span className="truncate max-w-[120px]">{acomodacao?.nome || '—'}</span>
                                                    </span>
                                                    <span className="text-border/60">·</span>
                                                    <span className="shrink-0">
                                                        {format(ci, "dd/MM")} → {format(co, "dd/MM")}
                                                    </span>
                                                    <span className="flex items-center gap-0.5 shrink-0 text-muted-foreground/70">
                                                        <Moon className="h-2.5 w-2.5" />
                                                        {noites} noite{noites !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
