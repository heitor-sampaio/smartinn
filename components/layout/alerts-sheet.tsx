'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Bell, AlertTriangle, Clock, Wrench, CheckCircle, Package,
    Sparkles, LogIn, UserX, LogOut, BellRing, X
} from 'lucide-react'
import { formatDistanceToNow, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'

export interface AlertsData {
    pousadaId: string
    // Notificações
    limpezasAtivas: { id: string; status: string; acomodacaoNome: string | null }[]
    checkinsHoje: { id: string; hospedeNome: string; acomodacaoNome: string }[]
    // Alertas
    urgentTasks: { id: string; titulo: string; acomodacaoNome: string | null }[]
    maintenanceRooms: { id: string; nome: string }[]
    pendingReservas: { id: string; hospedeNome: string; acomodacaoNome: string; criadoEm: string }[]
    stockBaixo: { id: string; nome: string; estoque: number }[]
    // Pendências
    stockZerado: { id: string; nome: string }[]
    noShows: { id: string; hospedeNome: string; acomodacaoNome: string; dataCheckin: string }[]
    checkoutsAtrasados: { id: string; hospedeNome: string; acomodacaoNome: string; dataCheckout: string }[]
}

type Tab = 'notificacoes' | 'alertas' | 'pendencias'

function SectionLabel({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
    return (
        <p className={`flex items-center gap-1.5 text-xs font-semibold mb-3 ${color}`}>
            {icon} {label} ({count})
        </p>
    )
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <CheckCircle className="h-7 w-7 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{label}</p>
        </div>
    )
}

export function AlertsSheet(props: AlertsData) {
    const {
        pousadaId,
        limpezasAtivas, checkinsHoje,
        urgentTasks, maintenanceRooms, pendingReservas, stockBaixo,
        stockZerado, noShows, checkoutsAtrasados
    } = props

    const router = useRouter()
    const [activeTab, setActiveTab] = useState<Tab>('notificacoes')
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())

    // Quando os dados do servidor mudam (router.refresh), limpa dismissed de IDs que já saíram
    useEffect(() => {
        const allNotifIds = new Set([
            ...limpezasAtivas.map(t => t.id),
            ...checkinsHoje.map(r => r.id),
        ])
        setDismissed(prev => {
            const next = new Set<string>()
            prev.forEach(id => { if (allNotifIds.has(id)) next.add(id) })
            return next
        })
    }, [limpezasAtivas, checkinsHoje])

    const dismiss = (id: string) => setDismissed(prev => new Set(prev).add(id))
    const dismissAll = () => {
        const allIds = [
            ...limpezasAtivas.map(t => t.id),
            ...checkinsHoje.map(r => r.id),
        ]
        setDismissed(new Set(allIds))
    }

    // Notificações filtradas (não dispensadas)
    const limpezasVisiveis = limpezasAtivas.filter(t => !dismissed.has(t.id))
    const checkinsVisiveis = checkinsHoje.filter(r => !dismissed.has(r.id))
    const totalNotif = limpezasVisiveis.length + checkinsVisiveis.length

    const totalAlertas = urgentTasks.length + maintenanceRooms.length + pendingReservas.length + stockBaixo.length
    const totalPend = stockZerado.length + noShows.length + checkoutsAtrasados.length
    const total = totalNotif + totalAlertas + totalPend

    const badgeColor = totalPend > 0 ? 'bg-red-500' : totalAlertas > 0 ? 'bg-amber-500' : totalNotif > 0 ? 'bg-blue-500' : ''
    const pingColor  = totalPend > 0 ? 'bg-red-400' : totalAlertas > 0 ? 'bg-amber-400' : 'bg-blue-400'

    useEffect(() => {
        if (!pousadaId) return
        const supabase = createClient()
        const channel = supabase.channel(`pousada-${pousadaId}`)
            .on('broadcast', { event: 'change' }, () => { router.refresh() })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [pousadaId, router])

    const tabs: { id: Tab; label: string; count: number; color: string }[] = [
        { id: 'notificacoes', label: 'Notificações', count: totalNotif,   color: 'text-blue-600 dark:text-blue-400' },
        { id: 'alertas',      label: 'Alertas',       count: totalAlertas, color: 'text-amber-600 dark:text-amber-400' },
        { id: 'pendencias',   label: 'Pendências',    count: totalPend,    color: 'text-red-600 dark:text-red-400' },
    ]

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {total > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-75`} />
                            <span className={`relative inline-flex h-2 w-2 rounded-full ${badgeColor}`} />
                        </span>
                    )}
                    <span className="sr-only">Notificações</span>
                </Button>
            </SheetTrigger>

            <SheetContent className="w-[360px] sm:w-[420px] flex flex-col p-0">
                <SheetHeader className="px-5 pt-5 pb-0 shrink-0">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <BellRing className="h-4 w-4 text-primary shrink-0" />
                        Central de Notificações
                        {total > 0 && (
                            <span className="ml-auto text-xs bg-muted font-semibold px-1.5 py-0.5 rounded-full">
                                {total}
                            </span>
                        )}
                    </SheetTitle>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4 border-b">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 pb-2.5 text-xs font-medium transition-colors relative ${
                                    activeTab === tab.id
                                        ? `${tab.color} after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-current after:rounded-t`
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`ml-1 text-[10px] font-bold px-1 py-0.5 rounded-full ${
                                        tab.id === 'pendencias' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                        tab.id === 'alertas'    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-5 divide-y">

                    {/* ── NOTIFICAÇÕES ── */}
                    {activeTab === 'notificacoes' && (
                        totalNotif === 0 ? <EmptyState label="Sem notificações no momento" /> : <>

                            {/* Botão marcar todas como lidas */}
                            <div className="pt-3 pb-1 flex justify-end">
                                <button
                                    onClick={dismissAll}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Marcar todas como lidas
                                </button>
                            </div>

                            {limpezasVisiveis.length > 0 && (
                                <div className="py-4">
                                    <SectionLabel
                                        icon={<Sparkles className="h-3.5 w-3.5 shrink-0" />}
                                        label="Limpezas solicitadas"
                                        count={limpezasVisiveis.length}
                                        color="text-blue-600 dark:text-blue-400"
                                    />
                                    <ul className="space-y-2">
                                        {limpezasVisiveis.map(t => (
                                            <li key={t.id} className="text-sm text-muted-foreground flex items-center gap-2">
                                                <span className={`h-2 w-2 rounded-full shrink-0 ${t.status === 'EM_ANDAMENTO' ? 'bg-blue-500' : 'bg-amber-400'}`} />
                                                <span className="font-medium text-foreground">{t.acomodacaoNome ?? '—'}</span>
                                                <span className="text-xs ml-auto shrink-0">
                                                    {t.status === 'EM_ANDAMENTO' ? 'Em andamento' : 'Aguardando'}
                                                </span>
                                                <button
                                                    onClick={() => dismiss(t.id)}
                                                    className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                                    title="Marcar como lida"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/dashboard/tarefas" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">Ver tarefas →</Link>
                                </div>
                            )}

                            {checkinsVisiveis.length > 0 && (
                                <div className="py-4">
                                    <SectionLabel
                                        icon={<LogIn className="h-3.5 w-3.5 shrink-0" />}
                                        label="Check-ins realizados hoje"
                                        count={checkinsVisiveis.length}
                                        color="text-emerald-600 dark:text-emerald-400"
                                    />
                                    <ul className="space-y-2">
                                        {checkinsVisiveis.map(r => (
                                            <li key={r.id} className="text-sm text-muted-foreground flex items-center gap-2">
                                                <span className="font-medium text-foreground">{r.hospedeNome}</span>
                                                <span className="truncate"> — {r.acomodacaoNome}</span>
                                                <button
                                                    onClick={() => dismiss(r.id)}
                                                    className="ml-auto shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                                    title="Marcar como lida"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/dashboard/reservas" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">Ver reservas →</Link>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── ALERTAS ── */}
                    {activeTab === 'alertas' && (
                        totalAlertas === 0 ? <EmptyState label="Nenhum alerta no momento" /> : <>
                            {urgentTasks.length > 0 && (
                                <div className="py-4">
                                    <SectionLabel
                                        icon={<AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                                        label="Tarefas urgentes"
                                        count={urgentTasks.length}
                                        color="text-red-600 dark:text-red-400"
                                    />
                                    <ul className="space-y-2">
                                        {urgentTasks.map(t => (
                                            <li key={t.id} className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">{t.titulo}</span>
                                                {t.acomodacaoNome && <span> — {t.acomodacaoNome}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/dashboard/tarefas" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">Ver tarefas →</Link>
                                </div>
                            )}
                            {maintenanceRooms.length > 0 && (
                                <div className="py-4">
                                    <SectionLabel
                                        icon={<Wrench className="h-3.5 w-3.5 shrink-0" />}
                                        label="Em manutenção"
                                        count={maintenanceRooms.length}
                                        color="text-orange-600 dark:text-orange-400"
                                    />
                                    <ul className="space-y-2">
                                        {maintenanceRooms.map(a => (
                                            <li key={a.id} className="text-sm font-medium">{a.nome}</li>
                                        ))}
                                    </ul>
                                    <Link href="/dashboard/acomodacoes" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">Ver acomodações →</Link>
                                </div>
                            )}
                            {pendingReservas.length > 0 && (
                                <div className="py-4">
                                    <SectionLabel
                                        icon={<Clock className="h-3.5 w-3.5 shrink-0" />}
                                        label="Reservas pendentes há +2 dias"
                                        count={pendingReservas.length}
                                        color="text-yellow-600 dark:text-yellow-400"
                                    />
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
                                    <Link href="/dashboard/reservas" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">Ver reservas →</Link>
                                </div>
                            )}
                            {stockBaixo.length > 0 && (
                                <div className="py-4">
                                    <SectionLabel
                                        icon={<Package className="h-3.5 w-3.5 shrink-0" />}
                                        label="Estoque baixo"
                                        count={stockBaixo.length}
                                        color="text-amber-600 dark:text-amber-400"
                                    />
                                    <ul className="space-y-2">
                                        {stockBaixo.map(p => (
                                            <li key={p.id} className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">{p.nome}</span>
                                                {' — '}
                                                <span className="text-amber-600 dark:text-amber-400">{p.estoque} un.</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/dashboard/produtos" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">Ver produtos →</Link>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── PENDÊNCIAS ── */}
                    {activeTab === 'pendencias' && (
                        totalPend === 0 ? <EmptyState label="Nenhuma pendência crítica" /> : <>
                            {checkoutsAtrasados.length > 0 && (
                                <div className="py-4">
                                    <SectionLabel
                                        icon={<LogOut className="h-3.5 w-3.5 shrink-0" />}
                                        label="Checkouts não realizados"
                                        count={checkoutsAtrasados.length}
                                        color="text-red-600 dark:text-red-400"
                                    />
                                    <ul className="space-y-2">
                                        {checkoutsAtrasados.map(r => (
                                            <li key={r.id} className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">{r.hospedeNome}</span>
                                                <span> — {r.acomodacaoNome}</span>
                                                <span className="block text-xs mt-0.5 text-red-500">
                                                    Previsto {format(parseISO(r.dataCheckout), "dd/MM", { locale: ptBR })}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/dashboard/reservas" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">Ver reservas →</Link>
                                </div>
                            )}
                            {noShows.length > 0 && (
                                <div className="py-4">
                                    <SectionLabel
                                        icon={<UserX className="h-3.5 w-3.5 shrink-0" />}
                                        label="No-shows recentes"
                                        count={noShows.length}
                                        color="text-red-600 dark:text-red-400"
                                    />
                                    <ul className="space-y-2">
                                        {noShows.map(r => (
                                            <li key={r.id} className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">{r.hospedeNome}</span>
                                                <span> — {r.acomodacaoNome}</span>
                                                <span className="block text-xs mt-0.5">
                                                    {format(parseISO(r.dataCheckin), "dd/MM", { locale: ptBR })}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/dashboard/reservas" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">Ver reservas →</Link>
                                </div>
                            )}
                            {stockZerado.length > 0 && (
                                <div className="py-4">
                                    <SectionLabel
                                        icon={<Package className="h-3.5 w-3.5 shrink-0" />}
                                        label="Estoque zerado"
                                        count={stockZerado.length}
                                        color="text-red-600 dark:text-red-400"
                                    />
                                    <ul className="space-y-2">
                                        {stockZerado.map(p => (
                                            <li key={p.id} className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">{p.nome}</span>
                                                {' — '}
                                                <span className="text-red-600 dark:text-red-400 font-semibold">zerado</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/dashboard/produtos" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block">Ver produtos →</Link>
                                </div>
                            )}
                        </>
                    )}

                </div>
            </SheetContent>
        </Sheet>
    )
}
