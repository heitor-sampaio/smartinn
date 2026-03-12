'use client'

import { useState, useMemo } from 'react'
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    addMonths, subMonths, addDays, startOfWeek,
    isSameDay, parseISO, isToday, isWeekend,
    differenceInCalendarDays
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, BedDouble, CalendarDays, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ViewPeriod = 'semana' | 'quinzena' | 'mes'

const PERIOD_CONFIG: Record<ViewPeriod, { label: string }> = {
    semana:   { label: 'Semana'  },
    quinzena: { label: '15 dias' },
    mes:      { label: 'Mês'     },
}

const STATUS_META: Record<string, { label: string; accent: string; bg: string; text: string }> = {
    PENDENTE:       { label: 'Pendente',   accent: '#d97706', bg: 'bg-amber-200   dark:bg-amber-700/80',      text: 'text-amber-900  dark:text-amber-50' },
    CONFIRMADA:     { label: 'Confirmada', accent: '#2563eb', bg: 'bg-blue-200    dark:bg-blue-700/80',        text: 'text-blue-900   dark:text-blue-50' },
    CHECKIN_FEITO:  { label: 'In-House',   accent: '#059669', bg: 'bg-emerald-200 dark:bg-emerald-700/80',     text: 'text-emerald-900 dark:text-emerald-50' },
    CHECKOUT_FEITO: { label: 'Concluída',  accent: '#64748b', bg: 'bg-slate-200   dark:bg-slate-600/80',       text: 'text-slate-700  dark:text-slate-100' },
    CANCELADA:      { label: 'Cancelada',  accent: '#dc2626', bg: 'bg-red-200     dark:bg-red-700/80',         text: 'text-red-900    dark:text-red-50' },
}

function getInitial(nome: string): string {
    return (nome?.trim() || '?')[0].toUpperCase()
}

interface MapaReservasProps {
    reservas: any[]
    acomodacoes: any[]
    onReservaClick: (reservaId: string) => void
    onAddReserva?: () => void
    onDayClick?: (acomodacaoId: string, date: Date) => void
}

export function MapaReservasClient({ reservas, acomodacoes, onReservaClick, onAddReserva, onDayClick }: MapaReservasProps) {
    const [period, setPeriod] = useState<ViewPeriod>('mes')
    const [rangeStart, setRangeStart] = useState(() => startOfMonth(new Date()))

    const daysInView = useMemo(() => {
        if (period === 'mes') {
            return eachDayOfInterval({ start: startOfMonth(rangeStart), end: endOfMonth(rangeStart) })
        }
        const count = period === 'semana' ? 7 : 15
        return eachDayOfInterval({ start: rangeStart, end: addDays(rangeStart, count - 1) })
    }, [period, rangeStart])

    const headerLabel = useMemo(() => {
        if (period === 'mes') return format(rangeStart, 'MMMM yyyy', { locale: ptBR })
        const end = daysInView[daysInView.length - 1]
        const sameMonth = rangeStart.getMonth() === end.getMonth() && rangeStart.getFullYear() === end.getFullYear()
        if (sameMonth) return `${format(rangeStart, 'd')} – ${format(end, "d 'de' MMM yyyy", { locale: ptBR })}`
        return `${format(rangeStart, "d MMM", { locale: ptBR })} – ${format(end, "d MMM yyyy", { locale: ptBR })}`
    }, [period, rangeStart, daysInView])

    function navigate(dir: 1 | -1) {
        if (period === 'semana')        setRangeStart(d => addDays(d, dir * 7))
        else if (period === 'quinzena') setRangeStart(d => addDays(d, dir * 15))
        else                            setRangeStart(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1))
    }

    function goToday() {
        const today = new Date()
        if (period === 'mes')           setRangeStart(startOfMonth(today))
        else if (period === 'semana')   setRangeStart(startOfWeek(today, { weekStartsOn: 1 }))
        else                            setRangeStart(today)
    }

    function handlePeriodChange(p: ViewPeriod) {
        setPeriod(p)
        if (p === 'mes')         setRangeStart(startOfMonth(rangeStart))
        else if (p === 'semana') setRangeStart(startOfWeek(rangeStart, { weekStartsOn: 1 }))
        // quinzena: mantém rangeStart atual
    }

    return (
        <div className="space-y-3">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <CalendarDays className="h-4 w-4" />
                    Mapa de Ocupação
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Seletor de período */}
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

                    {/* Navegação */}
                    <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" className="h-8 text-xs px-3" onClick={goToday}>
                            Hoje
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="w-52 text-center text-sm font-semibold capitalize select-none">
                            {headerLabel}
                        </span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Botão Nova Reserva */}
                    {onAddReserva && (
                        <Button onClick={onAddReserva}>
                            <Plus className="mr-2 h-4 w-4" /> Nova Reserva
                        </Button>
                    )}
                </div>
            </div>

            {/* Grade */}
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto overflow-y-auto max-h-[580px] relative">
                    <div className="inline-block min-w-full">

                        {/* Header dos dias */}
                        <div className="flex border-b sticky top-0 z-20 bg-muted/50 backdrop-blur">
                            <div className="w-44 flex-shrink-0 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-r bg-muted/70 sticky left-0 z-30 flex items-center">
                                Acomodação
                            </div>
                            <div className="flex flex-1 min-w-0">
                                {daysInView.map((day, idx) => {
                                    const today   = isToday(day)
                                    const weekend = isWeekend(day)
                                    const showMonthLabel = period !== 'mes' && format(day, 'd') === '1'
                                    return (
                                        <div
                                            key={idx}
                                            style={{ width: `${100 / daysInView.length}%` }}
                                            className={`flex-shrink-0 py-1.5 text-center border-r last:border-r-0 flex flex-col items-center justify-center gap-0.5
                                                ${today ? 'bg-primary/15' : weekend ? 'bg-muted/40' : ''}`}
                                        >
                                            <span className={`font-semibold uppercase leading-none
                                                ${period === 'semana' ? 'text-[10px]' : 'text-[9px]'}
                                                ${today ? 'text-primary' : 'text-muted-foreground/55'}`}>
                                                {period === 'semana'
                                                    ? format(day, 'EEE', { locale: ptBR })
                                                    : format(day, 'EEEEE', { locale: ptBR })
                                                }
                                            </span>
                                            {today ? (
                                                <span className="text-[11px] font-bold leading-none text-primary-foreground bg-primary w-5 h-5 rounded-full flex items-center justify-center mx-auto">
                                                    {format(day, 'd')}
                                                </span>
                                            ) : (
                                                <span className={`leading-none font-bold
                                                    ${period === 'mes' ? 'text-xs' : 'text-sm'}
                                                    ${weekend ? 'text-muted-foreground' : 'text-foreground/80'}`}>
                                                    {format(day, 'd')}
                                                </span>
                                            )}
                                            {showMonthLabel && (
                                                <span className="text-[8px] text-primary/70 font-semibold leading-none capitalize">
                                                    {format(day, 'MMM', { locale: ptBR })}
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Linhas das acomodações */}
                        <div className="flex flex-col divide-y divide-border/60">
                            {acomodacoes.map((acomodacao, rowIdx) => {
                                const reservasDaAco = reservas.filter(r => r.acomodacaoId === acomodacao.id)
                                const even = rowIdx % 2 === 0
                                const total = daysInView.length

                                return (
                                    <div key={acomodacao.id} className={`flex group relative h-16 ${even ? '' : 'bg-muted/10'}`}>

                                        {/* Nome da acomodação */}
                                        <div className={`w-44 flex-shrink-0 px-3 border-r sticky left-0 z-10 flex items-center gap-2.5 transition-colors
                                            ${even ? 'bg-card group-hover:bg-muted/20' : 'bg-muted/10 group-hover:bg-muted/25'}`}>
                                            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                                <BedDouble className="h-3.5 w-3.5 text-primary/70" />
                                            </div>
                                            <span className="text-xs font-medium truncate text-foreground/85 leading-tight">
                                                {acomodacao.nome}
                                            </span>
                                        </div>

                                        {/* Células de fundo + barras */}
                                        <div className="flex flex-1 min-w-0 relative">
                                            {daysInView.map((day, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{ width: `${100 / total}%` }}
                                                    onClick={() => onDayClick?.(acomodacao.id, day)}
                                                    className={`flex-shrink-0 border-r last:border-r-0 h-full
                                                        ${onDayClick ? 'cursor-pointer hover:bg-primary/10' : ''}
                                                        ${isToday(day) ? 'bg-primary/5' : isWeekend(day) ? 'bg-muted/15' : ''}`}
                                                />
                                            ))}

                                            {/* Barras de reserva — posicionamento em % */}
                                            {reservasDaAco.map(reserva => {
                                                const checkin  = typeof reserva.dataCheckin  === 'string' ? parseISO(reserva.dataCheckin)  : reserva.dataCheckin
                                                const checkout = typeof reserva.dataCheckout === 'string' ? parseISO(reserva.dataCheckout) : reserva.dataCheckout
                                                const viewStart = daysInView[0]
                                                const viewEnd   = daysInView[total - 1]

                                                if (checkout < viewStart || checkin > viewEnd || reserva.status === 'CANCELADA') return null

                                                let startIdx = daysInView.findIndex(d => isSameDay(d, checkin))
                                                let endIdx   = daysInView.findIndex(d => isSameDay(d, checkout))
                                                let isCutLeft = false, isCutRight = false

                                                if (startIdx === -1 && checkin < viewStart) { startIdx = 0; isCutLeft = true }
                                                if (endIdx   === -1 && checkout > viewEnd)  { endIdx = total - 1; isCutRight = true }
                                                if (startIdx === -1 || endIdx === -1) return null

                                                // Posicionamento em porcentagem relativa à grade
                                                const leftPct  = ((startIdx + (isCutLeft  ? 0 : 0.5)) / total) * 100
                                                const rightPct = ((endIdx   + (isCutRight ? 1 : 0.5)) / total) * 100
                                                const widthPct = rightPct - leftPct

                                                const noites   = differenceInCalendarDays(checkout, checkin)
                                                const meta     = STATUS_META[reserva.status] ?? STATUS_META.PENDENTE
                                                const showExtra = period === 'semana' || (period === 'quinzena' && noites >= 2) || noites >= 3

                                                return (
                                                    <div
                                                        key={reserva.id}
                                                        onClick={(e) => { e.stopPropagation(); onReservaClick(reserva.id); }}
                                                        title={`${reserva.hospede?.nome} · ${meta.label} · ${noites} noite${noites !== 1 ? 's' : ''}`}
                                                        className={`absolute top-2 bottom-2 cursor-pointer overflow-hidden
                                                            shadow-sm border border-black/8 dark:border-white/10
                                                            hover:shadow-md hover:z-20 hover:brightness-95
                                                            transition-all duration-100 ${meta.bg}
                                                            ${isCutLeft ? 'rounded-r-md' : isCutRight ? 'rounded-l-md' : 'rounded-md'}`}
                                                        style={{ left: `${leftPct}%`, width: `${widthPct}%`, zIndex: 10 }}
                                                    >
                                                        {/* Faixa de acento */}
                                                        {!isCutLeft && (
                                                            <div className="absolute left-0 top-0 bottom-0 w-[3px]"
                                                                style={{ background: meta.accent }} />
                                                        )}

                                                        <div className={`flex items-center gap-1.5 h-full overflow-hidden ${isCutLeft ? 'px-1.5' : 'pl-2.5 pr-1.5'}`}>
                                                            <div className="shrink-0 h-5 w-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                                                                style={{ background: meta.accent }}>
                                                                {getInitial(reserva.hospede?.nome || '?')}
                                                            </div>
                                                            <div className="flex flex-col overflow-hidden min-w-0">
                                                                <span className={`font-semibold truncate leading-tight ${meta.text}
                                                                    ${period === 'semana' ? 'text-xs' : 'text-[11px]'}`}>
                                                                    {reserva.hospede?.nome || '—'}
                                                                </span>
                                                                {showExtra && (
                                                                    <span className={`leading-tight opacity-60 truncate ${meta.text}
                                                                        ${period === 'semana' ? 'text-[10px]' : 'text-[9px]'}`}>
                                                                        {noites} noite{noites !== 1 ? 's' : ''}
                                                                    </span>
                                                                )}
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
                    </div>
                </div>

                {/* Legenda */}
                <div className="bg-muted/20 px-4 py-2.5 border-t flex items-center gap-x-5 gap-y-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Legenda
                    </span>
                    {Object.entries(STATUS_META)
                        .filter(([k]) => k !== 'CANCELADA')
                        .map(([key, meta]) => (
                            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.accent }} />
                                {meta.label}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    )
}
