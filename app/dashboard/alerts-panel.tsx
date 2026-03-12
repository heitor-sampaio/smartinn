import Link from 'next/link'
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from '@/components/ui/card'
import { AlertTriangle, Clock, Wrench, CheckCircle, Package } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UrgentTask { id: string; titulo: string; acomodacaoNome: string | null }
interface PendingReserva { id: string; hospedeNome: string; acomodacaoNome: string; criadoEm: string }
interface MaintenanceRoom { id: string; nome: string }
interface StockAlert { id: string; nome: string; estoque: number; zerado: boolean }

interface Props {
    urgentTasks: UrgentTask[]
    pendingReservas: PendingReserva[]
    maintenanceRooms: MaintenanceRoom[]
    stockAlerts: StockAlert[]
}

export function AlertsPanel({ urgentTasks, pendingReservas, maintenanceRooms, stockAlerts }: Props) {
    const total = urgentTasks.length + pendingReservas.length + maintenanceRooms.length + stockAlerts.length

    return (
        <Card>
            <CardHeader className="p-3 pb-1">
                <CardDescription className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Alertas & Pendências
                    {total > 0 && (
                        <span className="ml-auto text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold px-1.5 py-0.5 rounded-full">
                            {total}
                        </span>
                    )}
                </CardDescription>
                <CardTitle className="text-sm font-semibold">
                    {total === 0 ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="h-4 w-4" /> Sem alertas no momento
                        </span>
                    ) : (
                        <span>{total} {total === 1 ? 'item requer atenção' : 'itens requerem atenção'}</span>
                    )}
                </CardTitle>
            </CardHeader>

            {total > 0 && (
                <CardContent className="px-3 pb-1 pt-0 divide-y">
                    {urgentTasks.length > 0 && (
                        <div className="py-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                Tarefas Urgentes ({urgentTasks.length})
                            </p>
                            <ul className="space-y-1.5">
                                {urgentTasks.map(t => (
                                    <li key={t.id} className="text-xs truncate text-muted-foreground">
                                        <span className="font-medium text-foreground">{t.titulo}</span>
                                        {t.acomodacaoNome && <span> — {t.acomodacaoNome}</span>}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/dashboard/tarefas" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 block">
                                Ver tarefas →
                            </Link>
                        </div>
                    )}

                    {pendingReservas.length > 0 && (
                        <div className="py-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                Reservas Pendentes há +2 dias ({pendingReservas.length})
                            </p>
                            <ul className="space-y-1.5">
                                {pendingReservas.map(r => (
                                    <li key={r.id} className="text-xs truncate text-muted-foreground">
                                        <span className="font-medium text-foreground">{r.hospedeNome}</span>
                                        <span> — {r.acomodacaoNome}</span>
                                        <span> ({formatDistanceToNow(parseISO(r.criadoEm), { locale: ptBR, addSuffix: true })})</span>
                                    </li>
                                ))}
                            </ul>
                            <Link href="/dashboard/reservas" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 block">
                                Ver reservas →
                            </Link>
                        </div>
                    )}

                    {maintenanceRooms.length > 0 && (
                        <div className="py-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">
                                <Wrench className="h-3.5 w-3.5 shrink-0" />
                                Em Manutenção ({maintenanceRooms.length})
                            </p>
                            <ul className="space-y-1.5">
                                {maintenanceRooms.map(a => (
                                    <li key={a.id} className="text-xs font-medium">{a.nome}</li>
                                ))}
                            </ul>
                            <Link href="/dashboard/acomodacoes" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 block">
                                Ver acomodações →
                            </Link>
                        </div>
                    )}

                    {stockAlerts.length > 0 && (
                        <div className="py-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">
                                <Package className="h-3.5 w-3.5 shrink-0" />
                                Estoque Baixo ({stockAlerts.length})
                            </p>
                            <ul className="space-y-1.5">
                                {stockAlerts.map(p => (
                                    <li key={p.id} className="text-xs truncate text-muted-foreground">
                                        <span className="font-medium text-foreground">{p.nome}</span>
                                        {' — '}
                                        {p.zerado
                                            ? <span className="text-red-600 dark:text-red-400 font-semibold">zerado</span>
                                            : <span className="text-amber-600 dark:text-amber-400">{p.estoque} un.</span>
                                        }
                                    </li>
                                ))}
                            </ul>
                            <Link href="/dashboard/produtos" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 block">
                                Ver produtos →
                            </Link>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    )
}
