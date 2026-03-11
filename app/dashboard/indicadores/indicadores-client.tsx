'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, BarChart, Bar, Cell, Tooltip, ResponsiveContainer, Label } from "recharts"
import {
    BedDouble, TrendingUp, ShoppingCart, Users, Moon, MapPin, Clock,
    CalendarDays, Repeat2, XCircle, UserX, Receipt, Wrench, Percent,
    Package, Star, TrendingDown, Award, Layers, Hash,
    Droplets, Zap, Megaphone, Landmark, Handshake
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getDashboardIndicators } from '@/actions/indicadores'

type Period = 'hoje' | '7d' | '15d' | '30d' | '90d' | 'custom'

const PERIODS: { value: Period; label: string }[] = [
    { value: 'hoje', label: 'Hoje' },
    { value: '7d', label: '7 dias' },
    { value: '15d', label: '15 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
    { value: 'custom', label: 'Personalizado' },
]

function computeXInterval(period: Period, customStart?: string, customEnd?: string): number {
    if (period === 'hoje' || period === '7d') return 0          // cada dia (7 pts)
    if (period === '15d') return 2                               // a cada 3 dias (5 pts)
    if (period === '30d') return 4                               // a cada 5 dias (6 pts)
    if (period === '90d') return 14                              // a cada 15 dias (6 pts, dados diários)
    if (period === 'custom' && customStart && customEnd) {
        const days = Math.round((new Date(customEnd).getTime() - new Date(customStart).getTime()) / 86400000) + 1
        if (days <= 7)  return 0
        if (days <= 15) return 2
        if (days <= 31) return 4
        if (days <= 90) return 14  // a cada 15 dias (dados diários até 90d)
        return 0                   // mensal (>90d, dados mensais)
    }
    return 0
}

function computeRange(period: Period, customStart?: string, customEnd?: string): { startDate: string; endDate: string } {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    function daysAgoStr(n: number): string {
        const d = new Date(now)
        d.setDate(d.getDate() - n + 1)
        return d.toISOString().split('T')[0]
    }
    switch (period) {
        case 'hoje':   return { startDate: todayStr, endDate: todayStr }
        case '7d':     return { startDate: daysAgoStr(7), endDate: todayStr }
        case '15d':    return { startDate: daysAgoStr(15), endDate: todayStr }
        case '30d':    return { startDate: daysAgoStr(30), endDate: todayStr }
        case '90d':    return { startDate: daysAgoStr(90), endDate: todayStr }
        case 'custom': return { startDate: customStart || todayStr, endDate: customEnd || todayStr }
    }
}

const chartConfigReceita = {
    receita: { label: "Receita", color: "hsl(var(--primary))" },
} satisfies ChartConfig

const chartConfigStatus = {
    efetivadas: { label: "Efetivadas", color: "hsl(var(--primary))" },
    canceladas:  { label: "Canceladas",  color: "hsl(var(--destructive))" },
} satisfies ChartConfig

const chartConfigBookings = {
    _count: { label: "Reservas", color: "hsl(var(--primary))" },
} satisfies ChartConfig

const AXIS_TICK_STYLE = { fontSize: 9, fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.5 }

function useCountUp(target: number, duration = 900): number {
    const [current, setCurrent] = useState(0)
    useEffect(() => {
        if (target === 0) { setCurrent(0); return }
        let raf: number
        const t0 = performance.now()
        const tick = (now: number) => {
            const p = Math.min((now - t0) / duration, 1)
            setCurrent(target * (1 - (1 - p) ** 3))
            if (p < 1) raf = requestAnimationFrame(tick)
            else setCurrent(target)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [target, duration])
    return current
}

function KpiValue({ value, format }: { value: string | number; format: (v: number) => string }) {
    const num = typeof value === 'string' ? parseFloat(value) : value
    const n = useCountUp(isNaN(num) ? 0 : num)
    if (isNaN(num)) return <>{value}</>
    return <>{format(n)}</>
}

const fmtCur  = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`
const fmtPct1 = (v: number) => `${v.toFixed(1)}%`
const fmtInt  = (v: number) => `${Math.round(v)}`
const fmtDec1 = (v: number) => v.toFixed(1)

function KpiSparkline({
    data,
    stroke = 'hsl(var(--primary))',
    label = 'Valor',
    formatter = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`,
    xInterval = 0,
}: {
    data: { t: string; v: number }[]
    stroke?: string
    label?: string
    formatter?: (v: number) => string
    xInterval?: number
}) {
    if (!data || !data.some(d => d.v > 0)) {
        return <p className="text-[10px] text-muted-foreground/40 text-center pt-2">Sem dados no período</p>
    }
    const fmtAxis = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)
    return (
        <div className="h-20 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
                    <XAxis
                        dataKey="t"
                        tickLine={false}
                        axisLine={false}
                        tick={AXIS_TICK_STYLE}
                        interval={xInterval}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={AXIS_TICK_STYLE}
                        tickFormatter={fmtAxis}
                        width={30}
                        tickCount={3}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null
                            const { t, v } = payload[0].payload as { t: string; v: number }
                            return (
                                <div className="bg-background border rounded-lg px-2.5 py-1.5 text-xs shadow-lg">
                                    <p className="text-muted-foreground mb-0.5">{t}</p>
                                    <p className="font-semibold text-foreground">{label}: {formatter(v)}</p>
                                </div>
                            )
                        }}
                    />
                    <Area type="monotone" dataKey="v" stroke={stroke} fill={stroke} fillOpacity={0.15} strokeWidth={1.5} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                {children}
            </span>
            <div className="flex-1 h-px bg-border" />
        </div>
    )
}

export function DashboardIndicators({ data: initialData }: { data: any | null }) {
    const [data, setData] = useState(initialData)
    const [period, setPeriod] = useState<Period>('30d')
    const [customStart, setCustomStart] = useState('')
    const [customEnd, setCustomEnd] = useState('')
    const [isPending, startTransition] = useTransition()

    function handlePeriodSelect(p: Period) {
        setPeriod(p)
        if (p === 'custom') return
        const range = computeRange(p)
        startTransition(async () => {
            const newData = await getDashboardIndicators(range)
            setData(newData)
        })
    }

    const xInterval = computeXInterval(period, customStart, customEnd)
    type SparkProps = { data: { t: string; v: number }[]; stroke?: string; label?: string; formatter?: (v: number) => string }
    const Sparkline = (props: SparkProps) => <KpiSparkline {...props} xInterval={xInterval} />

    function applyCustom() {
        if (!customStart || !customEnd) return
        startTransition(async () => {
            const newData = await getDashboardIndicators(computeRange('custom', customStart, customEnd))
            setData(newData)
        })
    }

    if (!data || data._globalError) return (
        <div className="text-center py-10 text-muted-foreground">
            {data?._globalError ? (
                <div className="text-red-500 font-bold p-4 bg-red-100/20 rounded">
                    Erro no Servidor: {data._globalError}
                </div>
            ) : (
                "Sem dados suficientes para calcular indicadores."
            )}
        </div>
    )

    return (
        <div className="space-y-4">
            {/* Seletor de período */}
            <div className="flex flex-wrap items-center gap-2">
                {PERIODS.map(p => (
                    <Button
                        key={p.value}
                        size="sm"
                        variant={period === p.value ? 'default' : 'outline'}
                        onClick={() => handlePeriodSelect(p.value)}
                        disabled={isPending}
                    >
                        {p.label}
                    </Button>
                ))}
                {period === 'custom' && (
                    <>
                        <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-auto" max={customEnd || undefined} />
                        <span className="text-sm text-muted-foreground">até</span>
                        <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-auto" min={customStart || undefined} />
                        <Button size="sm" onClick={applyCustom} disabled={!customStart || !customEnd || isPending}>
                            {isPending ? 'Carregando...' : 'Aplicar'}
                        </Button>
                    </>
                )}
            </div>

            <div className={isPending ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
                <Tabs defaultValue="hospedagem" className="space-y-4 overflow-x-hidden">
                    <TabsList>
                        <TabsTrigger value="hospedagem" className="flex items-center gap-1.5">
                            <BedDouble className="h-4 w-4" /> Hospedagem
                        </TabsTrigger>
                        <TabsTrigger value="financeiro" className="flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4" /> Financeiro
                        </TabsTrigger>
                        <TabsTrigger value="consumos" className="flex items-center gap-1.5">
                            <ShoppingCart className="h-4 w-4" /> Extras & Consumo
                        </TabsTrigger>
                    </TabsList>

                    {/* ───────────────────────────────────────────
                        ABA 1: HOSPEDAGEM
                    ─────────────────────────────────────────── */}
                    <TabsContent value="hospedagem" className="space-y-6 pt-2">

                        {/* Hóspedes & Ocupação */}
                        <section className="space-y-3">
                            <SectionLabel>Hóspedes & Ocupação</SectionLabel>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Percent className="h-3.5 w-3.5" /> Taxa de Ocupação
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-primary"><KpiValue value={data.taxaOcupacao} format={fmtPct1} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Diárias vendidas sobre a capacidade total do período</p>
                                        <Sparkline data={data.hospedagemSeries?.ocupacao ?? []} label="Ocupação" formatter={fmtPct1} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5" /> Total de Hóspedes
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold"><KpiValue value={data.totalHospedes} format={fmtInt} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Hóspedes únicos com check-in no período</p>
                                        <Sparkline data={data.hospedagemSeries?.reservas ?? []} label="Reservas" formatter={fmtInt} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Repeat2 className="h-3.5 w-3.5" /> Taxa de Retorno
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-primary"><KpiValue value={data.taxaRetorno} format={fmtPct1} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground pt-0">
                                        Hóspedes do período com mais de uma reserva concluída
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <CalendarDays className="h-3.5 w-3.5" /> Antecedência das Reservas
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold"><KpiValue value={data.leadTime} format={v => `${v.toFixed(1)} dias`} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Dias antes do check-in que os hóspedes costumam reservar</p>
                                        <Sparkline data={data.hospedagemSeries?.leadTime ?? []} label="Antecedência" formatter={v => `${v.toFixed(1)} dias`} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Moon className="h-3.5 w-3.5" /> Tempo Médio de Estadia
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold">
                                            {Number(data.tempoMedioEstadia) > 0 ? <KpiValue value={data.tempoMedioEstadia} format={v => `${v.toFixed(1)} noites`} /> : 'N/D'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Média de diárias por reserva (LOS)</p>
                                        <Sparkline data={data.hospedagemSeries?.los ?? []} label="LOS" formatter={v => `${v.toFixed(1)} noites`} />
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Qualidade & Operacional */}
                        <section className="space-y-3">
                            <SectionLabel>Qualidade & Operacional</SectionLabel>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5" /> Hóspedes por Estadia
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold">
                                            {Number(data.mediaHospedesPorEstadia) > 0 ? <KpiValue value={data.mediaHospedesPorEstadia} format={v => `${v.toFixed(1)} pax`} /> : 'N/D'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Média de pessoas por reserva registrada</p>
                                        <Sparkline data={data.hospedagemSeries?.pax ?? []} label="Pax" formatter={v => `${v.toFixed(1)} pax`} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" /> Tempo Médio de Limpeza
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold">
                                            {data.tempoMedioLimpezaMin === null
                                                ? 'N/D'
                                                : <KpiValue value={data.tempoMedioLimpezaMin} format={v => { const m = Math.round(v); return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}min` }} />}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Média das tarefas de limpeza concluídas</p>
                                        <Sparkline data={data.hospedagemSeries?.limpeza ?? []} label="Limpeza" formatter={v => { const m = Math.round(v); return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}min` }} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <XCircle className="h-3.5 w-3.5" /> Taxa de Cancelamentos
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-destructive"><KpiValue value={data.cancelationRate} format={fmtPct1} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Porcentagem de reservas totais que foram canceladas</p>
                                        <Sparkline data={data.hospedagemSeries?.cancelRate ?? []} stroke="hsl(var(--destructive))" label="Cancelamentos" formatter={fmtPct1} />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <UserX className="h-3.5 w-3.5" /> No Show
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-orange-500"><KpiValue value={data.taxaNoShow} format={fmtPct1} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">{data.totalNoShows} reserva{data.totalNoShows !== 1 ? 's' : ''} sem comparecimento no período</p>
                                        <Sparkline data={data.hospedagemSeries?.noShowRate ?? []} stroke="hsl(26, 90%, 55%)" label="No Show" formatter={fmtPct1} />
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Análises Gráficas */}
                        <section className="space-y-4">
                            <SectionLabel>Análises</SectionLabel>

                            {/* Volume de Reservas — largura total */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Volume de Reservas</CardTitle>
                                    <CardDescription>Quantidade de reservas fechadas no período</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[220px] w-full overflow-hidden">
                                        <ChartContainer config={chartConfigBookings} className="h-full w-full">
                                            <BarChart accessibilityLayer data={data.bookingsPerMonthData} margin={{ top: 10, right: 0, left: 10, bottom: 24 }}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis dataKey="month" tickLine={false} tickMargin={8} axisLine={false} interval={xInterval} tick={{ fontSize: 11, fillOpacity: 0.5 }}>
                                                    <Label value="Período" position="insideBottom" offset={-12} style={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.5 }} />
                                                </XAxis>
                                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fillOpacity: 0.5 }}>
                                                    <Label value="Qtd. Reservas" angle={-90} position="insideLeft" offset={10} style={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.5, textAnchor: 'middle' }} />
                                                </YAxis>
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                <Bar dataKey="_count" fill="var(--color-_count)" radius={4} />
                                            </BarChart>
                                        </ChartContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Cidades + Comportamento lado a lado */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5" /> Principais Cidades de Origem
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        {data.principaisCidades.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">Sem dados de cidade cadastrados.</p>
                                        ) : (
                                            <ol className="space-y-2">
                                                {(() => {
                                                    const max = data.principaisCidades[0]?.count || 1
                                                    return data.principaisCidades.map((item: { cidade: string; count: number }, i: number) => (
                                                        <li key={item.cidade} className="space-y-0.5">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="font-medium truncate max-w-[70%]">
                                                                    {i === 0 && <span className="text-primary mr-1">★</span>}
                                                                    {item.cidade}
                                                                </span>
                                                                <span className="text-muted-foreground shrink-0">{item.count} res.</span>
                                                            </div>
                                                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                                <div className="h-full rounded-full bg-primary/70" style={{ width: `${(item.count / max) * 100}%` }} />
                                                            </div>
                                                        </li>
                                                    ))
                                                })()}
                                            </ol>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Comportamento do Cliente</CardTitle>
                                        <CardDescription>Percentual de cancelamentos no período</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex justify-center pb-0">
                                        <div className="h-[200px] w-full max-w-[260px]">
                                            <ChartContainer config={chartConfigStatus} className="h-full w-full">
                                                <PieChart>
                                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                    <Pie data={data.statusChartData} dataKey="_count" nameKey="status" innerRadius={55} outerRadius={75} stroke="none">
                                                        {data.statusChartData.map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ChartContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>
                    </TabsContent>

                    {/* ───────────────────────────────────────────
                        ABA 2: FINANCEIRO
                    ─────────────────────────────────────────── */}
                    <TabsContent value="financeiro" className="space-y-6 pt-2">

                        {/* Preço & Eficiência */}
                        <section className="space-y-3">
                            <SectionLabel>Preço & Eficiência</SectionLabel>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <BedDouble className="h-3.5 w-3.5" /> ADR — Diária Média
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold"><KpiValue value={data.adr} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Preço médio pago por noite de estadia</p>
                                        <Sparkline data={data.financialSeries?.adr ?? []} label="ADR" />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <TrendingUp className="h-3.5 w-3.5" /> RevPAR
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold"><KpiValue value={data.revpar} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Receita por quarto disponível, incluindo noites vazias</p>
                                        <Sparkline data={data.financialSeries?.revpar ?? []} label="RevPAR" />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Receipt className="h-3.5 w-3.5" /> Ticket Médio por Reserva
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-primary"><KpiValue value={data.ticketMedio} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Valor médio por hospedagem incluindo diária e consumos</p>
                                        <Sparkline data={data.financialSeries?.ticket ?? []} label="Ticket Médio" stroke="hsl(var(--primary))" />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5" /> LTV Médio por Hóspede
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-primary"><KpiValue value={data.ltvMedio} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Receita média gerada por hóspede único no período</p>
                                        <Sparkline data={data.financialSeries?.receita ?? []} label="Receita" stroke="hsl(var(--primary))" />
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Faturamento no Período */}
                        <section className="space-y-3">
                            <SectionLabel>Faturamento no Período</SectionLabel>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <CalendarDays className="h-3.5 w-3.5" /> Faturamento Médio / Mês
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold"><KpiValue value={data.mediaFaturamentoMensal} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Receita de diárias por mês no período selecionado</p>
                                        <Sparkline data={data.financialSeries?.receita ?? []} label="Receita" />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <CalendarDays className="h-3.5 w-3.5" /> Faturamento Médio / Semana
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold"><KpiValue value={data.mediaFaturamentoSemanal} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Receita de diárias por semana no período selecionado</p>
                                        <Sparkline data={data.financialSeries?.receita ?? []} label="Receita" />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <ShoppingCart className="h-3.5 w-3.5" /> Receita de Extras / Mês
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold"><KpiValue value={data.receitaMediaMensalConsumo} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Receita média mensal gerada por consumos extras</p>
                                        <Sparkline data={data.financialSeries?.extras ?? []} label="Extras" stroke="#16a34a" />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <ShoppingCart className="h-3.5 w-3.5" /> Gasto Extra por Hospedagem
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-green-600"><KpiValue value={data.receitaExtraPorHospedagem} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Quanto cada hóspede gasta em extras além da diária</p>
                                        <Sparkline data={data.financialSeries?.extrasPerBooking ?? []} label="Extra/Reserva" stroke="#16a34a" />
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Custos Operacionais */}
                        <section className="space-y-3">
                            <SectionLabel>Custos Operacionais / Mês</SectionLabel>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <Card className="bg-destructive/5 dark:bg-destructive/10 border-destructive/20">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Wrench className="h-3.5 w-3.5" /> Manutenção
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-destructive"><KpiValue value={data.custoMedioMensalManutencao} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Gasto médio por mês com reparos e manutenção</p>
                                        <Sparkline data={data.custosSeries?.manutencao ?? []} stroke="hsl(var(--destructive))" label="Manutenção" />
                                    </CardContent>
                                </Card>
                                <Card className="bg-destructive/5 dark:bg-destructive/10 border-destructive/20">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Droplets className="h-3.5 w-3.5" /> Água
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-destructive"><KpiValue value={data.custoMedioMensalAgua} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Custo médio mensal com conta de água</p>
                                        <Sparkline data={data.custosSeries?.agua ?? []} stroke="hsl(var(--destructive))" label="Água" />
                                    </CardContent>
                                </Card>
                                <Card className="bg-destructive/5 dark:bg-destructive/10 border-destructive/20">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Zap className="h-3.5 w-3.5" /> Energia
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-destructive"><KpiValue value={data.custoMedioMensalEnergia} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Custo médio mensal com energia elétrica</p>
                                        <Sparkline data={data.custosSeries?.energia ?? []} stroke="hsl(var(--destructive))" label="Energia" />
                                    </CardContent>
                                </Card>
                                <Card className="bg-destructive/5 dark:bg-destructive/10 border-destructive/20">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Megaphone className="h-3.5 w-3.5" /> Marketing
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-destructive"><KpiValue value={data.custoMedioMensalMarketing} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Gasto médio mensal com divulgação e publicidade</p>
                                        <Sparkline data={data.custosSeries?.marketing ?? []} stroke="hsl(var(--destructive))" label="Marketing" />
                                    </CardContent>
                                </Card>
                                <Card className="bg-destructive/5 dark:bg-destructive/10 border-destructive/20">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Landmark className="h-3.5 w-3.5" /> Impostos
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-destructive"><KpiValue value={data.custoMedioMensalImpostos} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Custo médio mensal com tributos e obrigações fiscais</p>
                                        <Sparkline data={data.custosSeries?.impostos ?? []} stroke="hsl(var(--destructive))" label="Impostos" />
                                    </CardContent>
                                </Card>
                                <Card className="bg-destructive/5 dark:bg-destructive/10 border-destructive/20">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Handshake className="h-3.5 w-3.5" /> Comissões
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-destructive"><KpiValue value={data.custoMedioMensalComissoes} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Custo médio mensal com comissões pagas a OTAs e parceiros</p>
                                        <Sparkline data={data.custosSeries?.comissoes ?? []} stroke="hsl(var(--destructive))" label="Comissões" />
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Gráfico de Receita */}
                        <section className="space-y-3">
                            <SectionLabel>Evolução da Receita</SectionLabel>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Desempenho de Receita (Bruta)</CardTitle>
                                    <CardDescription>
                                        Faturamento de reservas no período — Total: R$ {data.totalReceitaAno}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[280px] w-full overflow-hidden">
                                        <ChartContainer config={chartConfigReceita} className="h-full w-full">
                                            <AreaChart accessibilityLayer data={data.revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 24 }}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} interval={xInterval} tick={{ fontSize: 11, fillOpacity: 0.5 }}>
                                                    <Label value="Período" position="insideBottom" offset={-12} style={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.5 }} />
                                                </XAxis>
                                                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} width={65} tick={{ fontSize: 11, fillOpacity: 0.5 }}>
                                                    <Label value="Receita (R$)" angle={-90} position="insideLeft" offset={10} style={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.5, textAnchor: 'middle' }} />
                                                </YAxis>
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                                <Area dataKey="receita" type="monotone" fill="var(--color-receita)" fillOpacity={0.4} stroke="var(--color-receita)" />
                                            </AreaChart>
                                        </ChartContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    </TabsContent>

                    {/* ───────────────────────────────────────────
                        ABA 3: EXTRAS & CONSUMO
                    ─────────────────────────────────────────── */}
                    <TabsContent value="consumos" className="space-y-6 pt-2">

                        {/* Engajamento de Consumo */}
                        <section className="space-y-3">
                            <SectionLabel>Engajamento de Consumo</SectionLabel>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Percent className="h-3.5 w-3.5" /> Taxa de Consumo
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-primary"><KpiValue value={data.taxaConsumo} format={fmtPct1} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">{data.reservasComConsumo} reserva{data.reservasComConsumo !== 1 ? 's' : ''} realizaram consumo extra no período</p>
                                        <Sparkline data={data.financialSeries?.extras ?? []} label="Receita de Extras" stroke="#16a34a" />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Hash className="h-3.5 w-3.5" /> Média de Itens por Estadia
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold"><KpiValue value={data.mediaItensConsumo} format={fmtDec1} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground pt-0">
                                        Itens extras consumidos por reserva que consumiu
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Receipt className="h-3.5 w-3.5" /> Ticket Médio de Consumo
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold text-green-600"><KpiValue value={data.ticketConsumo} format={fmtCur} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">Gasto médio em extras das reservas que consumiram</p>
                                        <Sparkline data={data.financialSeries?.extrasPerBooking ?? []} label="Extra/Reserva" stroke="#16a34a" />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Award className="h-3.5 w-3.5" /> Categoria Mais Lucrativa
                                        </CardDescription>
                                        <CardTitle className="text-xl font-bold leading-tight mt-1">{data.categoriaMaisLucrativa}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground pt-0">
                                        Categoria que gerou mais receita com extras no período
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Catálogo Ativo */}
                        <section className="space-y-3">
                            <SectionLabel>Catálogo Ativo</SectionLabel>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Package className="h-3.5 w-3.5" /> Produtos Cadastrados
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold"><KpiValue value={data.totalProdutosCatalogo} format={fmtInt} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground pt-0">
                                        Itens ativos nas categorias Frigobar, Restaurante e Outros
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <Layers className="h-3.5 w-3.5" /> Serviços Cadastrados
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-bold"><KpiValue value={data.totalServicosCatalogo} format={fmtInt} /></CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground pt-0">
                                        Itens ativos nas categorias Serviço e Passeio
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Rankings de Produtos */}
                        <section className="space-y-3">
                            <SectionLabel>Rankings de Produtos</SectionLabel>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="text-primary font-medium flex items-center gap-1.5">
                                            <Star className="h-3.5 w-3.5" /> Produto Mais Consumido
                                        </CardDescription>
                                        <CardTitle className="text-xl font-bold leading-tight mt-1">
                                            {data.produtoMaisConsumido}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground pt-0">
                                        Produto (Frigobar / Restaurante / Outro) mais vendido no período
                                    </CardContent>
                                </Card>
                                <Card className="bg-muted/30">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <TrendingDown className="h-3.5 w-3.5" /> Produto Menos Consumido
                                        </CardDescription>
                                        <CardTitle className="text-xl font-bold leading-tight mt-1">
                                            {data.produtoMenosConsumido}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground pt-0">
                                        Produto com menor quantidade vendida — candidato à revisão
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Rankings de Serviços */}
                        <section className="space-y-3">
                            <SectionLabel>Rankings de Serviços</SectionLabel>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="text-primary font-medium flex items-center gap-1.5">
                                            <Star className="h-3.5 w-3.5" /> Serviço Mais Contratado
                                        </CardDescription>
                                        <CardTitle className="text-xl font-bold leading-tight mt-1">
                                            {data.servicoMaisConsumido}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground pt-0">
                                        Serviço ou passeio mais vendido no período
                                    </CardContent>
                                </Card>
                                <Card className="bg-muted/30">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1.5">
                                            <TrendingDown className="h-3.5 w-3.5" /> Serviço Menos Contratado
                                        </CardDescription>
                                        <CardTitle className="text-xl font-bold leading-tight mt-1">
                                            {data.servicoMenosConsumido}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground pt-0">
                                        Serviço com menor demanda — candidato à promoção ou remoção
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                    </TabsContent>

                </Tabs>
            </div>
        </div>
    )
}
