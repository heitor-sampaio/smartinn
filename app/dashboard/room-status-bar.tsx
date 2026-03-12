import Link from 'next/link'
import { Card, CardHeader, CardDescription } from '@/components/ui/card'
import { BedDouble } from 'lucide-react'

interface Props {
    summary: Record<string, number>
}

const STATUS_CONFIG = [
    { key: 'DISPONIVEL', label: 'Livre', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
    { key: 'OCUPADO',    label: 'Ocupado', dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400' },
    { key: 'LIMPEZA',    label: 'Limpeza', dot: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' },
    { key: 'MANUTENCAO', label: 'Manutenção', dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400' },
    { key: 'BLOQUEADO',  label: 'Bloqueado', dot: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-400' },
]

export function RoomStatusBar({ summary }: Props) {
    const total = Object.values(summary).reduce((a, b) => a + b, 0)

    return (
        <Link href="/dashboard/acomodacoes">
            <Card className="hover:bg-accent/40 transition-colors">
                <CardHeader className="p-3 py-2.5">
                    <CardDescription className="flex items-center gap-1.5 mb-1">
                        <BedDouble className="h-3.5 w-3.5" />
                        Status dos Quartos — {total} {total === 1 ? 'acomodação' : 'acomodações'}
                    </CardDescription>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                        {STATUS_CONFIG.map(({ key, label, dot, text }) => {
                            const count = summary[key] ?? 0
                            if (count === 0) return null
                            return (
                                <span key={key} className={`flex items-center gap-1.5 text-xs font-medium ${text}`}>
                                    <span className={`inline-block w-2 h-2 rounded-sm shrink-0 ${dot}`} />
                                    {label}: <strong>{count}</strong>
                                </span>
                            )
                        })}
                    </div>
                </CardHeader>
            </Card>
        </Link>
    )
}
