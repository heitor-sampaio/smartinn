import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getDashboardMetrics, getDailyOperations, getOccupancyChartsData } from '@/actions/dashboard'
import { CalendarDays, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import { KanbanDiario } from './kanban-diario'
import { OccupancyCharts } from './occupancy-charts'

export default async function DashboardPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const metrics = await getDashboardMetrics() || {
        totalReservasMes: 0,
        hospedagensRealizadas: 0,
        reservasCanceladas: 0,
        taxaOcupacao: '0.0'
    }

    const { entradas, inHouse, saidas } = await getDailyOperations()
    const occupancyData = await getOccupancyChartsData()

    return (
        <div className="flex-1 space-y-4 p-3 md:p-8 pt-4 md:pt-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-3xl font-bold tracking-tight">Dashboard Central</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* 1. Reservas Totais */}
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-3 md:p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-xs md:text-sm font-medium">Reservas do Mês</h3>
                        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    <div className="p-3 md:p-6 pt-0">
                        <div className="text-xl md:text-2xl font-bold">{metrics.totalReservasMes}</div>
                        <p className="text-xs text-muted-foreground hidden md:block">Volume de pedidos ativos neste mês</p>
                    </div>
                </div>

                {/* 2. Hospedagens Realizadas */}
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-3 md:p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-xs md:text-sm font-medium">Hospedagens</h3>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    </div>
                    <div className="p-3 md:p-6 pt-0">
                        <div className="text-xl md:text-2xl font-bold">{metrics.hospedagensRealizadas}</div>
                        <p className="text-xs text-muted-foreground hidden md:block">Check-outs e pagamentos concluídos</p>
                    </div>
                </div>

                {/* 3. Reservas Canceladas */}
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-3 md:p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-xs md:text-sm font-medium">Cancelamentos</h3>
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    </div>
                    <div className="p-3 md:p-6 pt-0">
                        <div className="text-xl md:text-2xl font-bold">{metrics.reservasCanceladas}</div>
                        <p className="text-xs text-muted-foreground hidden md:block">Desistências computadas</p>
                    </div>
                </div>

                {/* 4. Taxa de Ocupação Mês */}
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-3 md:p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-xs md:text-sm font-medium">Tx. Ocupação</h3>
                        <TrendingUp className="h-4 w-4 text-blue-500 shrink-0" />
                    </div>
                    <div className="p-3 md:p-6 pt-0">
                        <div className="text-xl md:text-2xl font-bold">{metrics.taxaOcupacao}%</div>
                        <p className="text-xs text-muted-foreground hidden md:block">Alocação média mensal</p>
                    </div>
                </div>
            </div>

            {/* Nova Seção: Fluxo de Operações de Hoje (Kanban) */}
            <div className="mt-8">
                <KanbanDiario entradas={entradas} inHouse={inHouse} saidas={saidas} />
            </div>

            {/* Nova Seção: Gráficos Analíticos */}
            <div className="mt-8">
                <OccupancyCharts data={occupancyData} />
            </div>

        </div>
    )
}
