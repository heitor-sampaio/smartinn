'use client'

import { Card, CardHeader, CardDescription, CardContent } from '@/components/ui/card'
import { LogIn, LogOut, BedDouble, Users } from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ReservaItem {
    id: string
    hospede: { nome: string }
    acomodacao: { nome: string }
    dataCheckin: string | Date
    dataCheckout: string | Date
    totalHospedes: number
}

interface ColumnConfig {
    title: string
    description: string
    icon: React.ReactNode
    items: ReservaItem[]
    accent: string
    badgeClass: string
    emptyText: string
}

function BookingCard({ reserva, accent }: { reserva: ReservaItem; accent: string }) {
    const checkin = new Date(reserva.dataCheckin)
    const checkout = new Date(reserva.dataCheckout)
    const noites = differenceInCalendarDays(checkout, checkin)

    return (
        <div className={`rounded-lg border-l-4 ${accent} bg-muted/40 px-3 py-2`}>
            <p className="text-xs font-semibold leading-tight truncate">{reserva.hospede.nome}</p>
            <p className="text-[11px] text-muted-foreground truncate">{reserva.acomodacao.nome}</p>
            <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-muted-foreground">
                    {format(checkin, "dd/MM", { locale: ptBR })} → {format(checkout, "dd/MM", { locale: ptBR })}
                    {noites > 0 && <span className="opacity-60 ml-1">({noites}n)</span>}
                </span>
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground shrink-0">
                    <Users className="h-3 w-3" />{reserva.totalHospedes}
                </span>
            </div>
        </div>
    )
}

function KanbanColumn({ title, description, icon, items, accent, badgeClass, emptyText }: ColumnConfig) {
    return (
        <Card>
            <CardHeader className="p-3 pb-1">
                <CardDescription className="flex items-center gap-1.5">
                    {icon} {title}
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                        {items.length}
                    </span>
                </CardDescription>
                <p className="text-[10px] text-muted-foreground/60 leading-snug">{description}</p>
            </CardHeader>
            <CardContent className="px-2 pb-2 pt-1 flex flex-col gap-1.5">
                {items.length === 0
                    ? <p className="text-xs text-muted-foreground text-center py-2">{emptyText}</p>
                    : items.map(r => <BookingCard key={r.id} reserva={r} accent={accent} />)
                }
            </CardContent>
        </Card>
    )
}

export function KanbanDiario({
    entradas,
    inHouse,
    saidas
}: {
    entradas: ReservaItem[]
    inHouse: ReservaItem[]
    saidas: ReservaItem[]
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">Operações de Hoje</h3>
                <span className="text-xs text-muted-foreground">
                    {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <KanbanColumn
                    title="Check-outs"
                    description="Saídas previstas para hoje"
                    icon={<LogOut className="h-3.5 w-3.5" />}
                    items={saidas}
                    accent="border-slate-400"
                    badgeClass="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    emptyText="Nenhuma saída hoje"
                />
                <KanbanColumn
                    title="In-House"
                    description="Hóspedes em permanência hoje"
                    icon={<BedDouble className="h-3.5 w-3.5" />}
                    items={inHouse}
                    accent="border-emerald-400"
                    badgeClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                    emptyText="Nenhuma permanência hoje"
                />
                <KanbanColumn
                    title="Check-ins"
                    description="Chegadas previstas para hoje"
                    icon={<LogIn className="h-3.5 w-3.5" />}
                    items={entradas}
                    accent="border-blue-400"
                    badgeClass="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    emptyText="Nenhuma chegada hoje"
                />
            </div>
        </div>
    )
}
