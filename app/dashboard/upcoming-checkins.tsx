import Link from 'next/link'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarCheck, ArrowRight } from 'lucide-react'

interface CheckinItem {
    id: string
    hospedeNome: string
    acomodacaoNome: string
    dataCheckin: string
    dataCheckout: string
    noites: number
}

interface Props {
    checkins: CheckinItem[]
}

function formatCheckinDate(iso: string) {
    const d = parseISO(iso)
    if (isToday(d)) return 'Hoje'
    if (isTomorrow(d)) return 'Amanhã'
    return format(d, "dd/MM", { locale: ptBR })
}

export function UpcomingCheckins({ checkins }: Props) {
    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow flex flex-col h-full">
            <div className="p-3 pb-2 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Próximas Chegadas</h3>
                </div>
                <span className="text-xs text-muted-foreground">7 dias</span>
            </div>
            <div className="flex-1 overflow-hidden">
                {checkins.length === 0 ? (
                    <p className="p-4 text-xs text-muted-foreground text-center">
                        Nenhuma chegada nos próximos 7 dias
                    </p>
                ) : (
                    <ul className="divide-y">
                        {checkins.map(c => (
                            <li key={c.id} className="px-3 py-2 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">{c.hospedeNome}</p>
                                    <p className="text-xs text-muted-foreground truncate">{c.acomodacaoNome}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-semibold">{formatCheckinDate(c.dataCheckin)}</p>
                                    <p className="text-xs text-muted-foreground">{c.noites}n</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="p-2 border-t">
                <Link
                    href="/dashboard/reservas"
                    className="flex items-center justify-end gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    Ver todas <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        </div>
    )
}
