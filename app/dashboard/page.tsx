import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
    getDashboardMetrics,
    getDailyOperations,
    getAcomodacaoStatusSummary,
    getMonthlyFinancial,
    getDashboardAlerts,
} from '@/actions/dashboard'
import { TrendingUp, XCircle, UserX } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KanbanDiario } from './kanban-diario'
import { RoomStatusBar } from './room-status-bar'
import { MonthlyFinancial } from './monthly-financial'
import { AlertsPanel } from './alerts-panel'

export default async function DashboardPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const [
        metrics,
        { entradas, inHouse, saidas },
        roomStatus,
        monthlyFinancial,
        alerts,
    ] = await Promise.all([
        getDashboardMetrics(),
        getDailyOperations(),
        getAcomodacaoStatusSummary(),
        getMonthlyFinancial(),
        getDashboardAlerts(),
    ])

    const safeMetrics = metrics || {
        taxaOcupacao: '0.0',
        taxaCancelamento: '0.0',
        taxaNoShow: '0.0',
    }

    return (
        <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight">Dashboard Central</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Visão geral das operações, indicadores e pendências da pousada.</p>
                </div>
            </div>

            {/* Alertas & Pendências */}
            <AlertsPanel
                urgentTasks={alerts.urgentTasks}
                pendingReservas={alerts.pendingReservas}
                maintenanceRooms={alerts.maintenanceRooms}
                stockAlerts={alerts.stockAlerts}
            />

            {/* Status dos Quartos */}
            <RoomStatusBar summary={roomStatus} />

            {/* 3 KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
                <Card>
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5" /> Tx. Ocupação
                        </CardDescription>
                        <p className="text-[10px] text-muted-foreground/60 leading-snug">Alocação média das acomodações no mês</p>
                        <CardTitle className="text-2xl font-bold text-primary">{safeMetrics.taxaOcupacao}%</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0" />
                </Card>

                <Card>
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="flex items-center gap-1.5">
                            <XCircle className="h-3.5 w-3.5" /> Tx. Cancelamento
                        </CardDescription>
                        <p className="text-[10px] text-muted-foreground/60 leading-snug">Canceladas sobre o total de reservas do mês</p>
                        <CardTitle className="text-2xl font-bold">{safeMetrics.taxaCancelamento}%</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0" />
                </Card>

                <Card>
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="flex items-center gap-1.5">
                            <UserX className="h-3.5 w-3.5" /> Tx. No-Show
                        </CardDescription>
                        <p className="text-[10px] text-muted-foreground/60 leading-snug">No-shows sobre o total de reservas do mês</p>
                        <CardTitle className="text-2xl font-bold">{safeMetrics.taxaNoShow}%</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0" />
                </Card>
            </div>

            {/* Financeiro do Mês */}
            <MonthlyFinancial
                entradas={monthlyFinancial.entradas}
                saidas={monthlyFinancial.saidas}
                saldo={monthlyFinancial.saldo}
            />

            {/* Kanban Diário */}
            <KanbanDiario entradas={entradas} inHouse={inHouse} saidas={saidas} />
        </div>
    )
}
