'use client'

import Link from 'next/link'
import { Bell, AlertTriangle, Clock, Wrench, CheckCircle, Package } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export interface AlertsData {
    urgentTasks: { id: string; titulo: string; acomodacaoNome: string | null }[]
    pendingReservas: { id: string; hospedeNome: string; acomodacaoNome: string; criadoEm: string }[]
    maintenanceRooms: { id: string; nome: string }[]
    stockAlerts: { id: string; nome: string; estoque: number; zerado: boolean }[]
}

export function AlertsSheet({ urgentTasks, pendingReservas, maintenanceRooms, stockAlerts }: AlertsData) {
    const total = urgentTasks.length + pendingReservas.length + maintenanceRooms.length + stockAlerts.length

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {total > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                        </span>
                    )}
                    <span className="sr-only">Alertas e pendências</span>
                </Button>
            </SheetTrigger>

            <SheetContent className="w-[360px] sm:w-[420px] flex flex-col p-0">
                <SheetHeader className="px-5 pt-5 pb-4 border-b shrink-0">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        Alertas & Pendências
                        {total > 0 && (
                            <span className="ml-auto text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold px-1.5 py-0.5 rounded-full">
                                {total}
                            </span>
                        )}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-5 divide-y">
                    {total === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                            <CheckCircle className="h-8 w-8 text-emerald-500" />
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Sem alertas no momento</p>
                        </div>
                    ) : (
                        <>
                            {urgentTasks.length > 0 && (
                                <div className="py-4">
                                    <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 mb-3">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                        Tarefas Urgentes ({urgentTasks.length})
                                    </p>
                                    <ul className="space-y-2">
                                        {urgentTasks.map(t => (
                                            <li key={t.id} className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">{t.titulo}</span>
                                                {t.acomodacaoNome && <span> — {t.acomodacaoNome}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/dashboard/tarefas" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">
                                        Ver tarefas →
                                    </Link>
                                </div>
                            )}

                            {pendingReservas.length > 0 && (
                                <div className="py-4">
                                    <p className="flex items-center gap-1.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-3">
                                        <Clock className="h-3.5 w-3.5 shrink-0" />
                                        Reservas Pendentes há +2 dias ({pendingReservas.length})
                                    </p>
                                    <ul className="space-y-2">
                                        {pendingReservas.map(r => (
                                            <li key={r.id} className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">{r.hospedeNome}</span>
                                                <span> — {r.acomodacaoNome}</span>
                                                <span className="block text-xs mt-0.5">
                                                    {formatDistanceToNow(parseISO(r.criadoEm), { locale: ptBR, addSuffix: true })}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/dashboard/reservas" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">
                                        Ver reservas →
                                    </Link>
                                </div>
                            )}

                            {maintenanceRooms.length > 0 && (
                                <div className="py-4">
                                    <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 mb-3">
                                        <Wrench className="h-3.5 w-3.5 shrink-0" />
                                        Em Manutenção ({maintenanceRooms.length})
                                    </p>
                                    <ul className="space-y-2">
                                        {maintenanceRooms.map(a => (
                                            <li key={a.id} className="text-sm font-medium">{a.nome}</li>
                                        ))}
                                    </ul>
                                    <Link href="/dashboard/acomodacoes" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">
                                        Ver acomodações →
                                    </Link>
                                </div>
                            )}

                            {stockAlerts.length > 0 && (
                                <div className="py-4">
                                    <p className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 mb-3">
                                        <Package className="h-3.5 w-3.5 shrink-0" />
                                        Estoque Baixo ({stockAlerts.length})
                                    </p>
                                    <ul className="space-y-2">
                                        {stockAlerts.map(p => (
                                            <li key={p.id} className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">{p.nome}</span>
                                                {' — '}
                                                {p.zerado
                                                    ? <span className="text-red-600 dark:text-red-400 font-semibold">zerado</span>
                                                    : <span className="text-amber-600 dark:text-amber-400">{p.estoque} un.</span>
                                                }
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/dashboard/produtos" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">
                                        Ver produtos →
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
