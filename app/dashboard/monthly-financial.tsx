import Link from 'next/link'
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from 'lucide-react'

interface Props {
    entradas: number
    saidas: number
    saldo: number
}

function fmt(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function MonthlyFinancial({ entradas, saidas, saldo }: Props) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Financeiro do Mês</h3>
                <Link
                    href="/dashboard/financeiro"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    Ver detalhes <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
                <Card>
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5" /> Entradas
                        </CardDescription>
                        <p className="text-[10px] text-muted-foreground/60 leading-snug">Receitas registradas no mês</p>
                        <CardTitle className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{fmt(entradas)}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0" />
                </Card>

                <Card>
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="flex items-center gap-1.5">
                            <TrendingDown className="h-3.5 w-3.5" /> Saídas
                        </CardDescription>
                        <p className="text-[10px] text-muted-foreground/60 leading-snug">Despesas registradas no mês</p>
                        <CardTitle className="text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">{fmt(saidas)}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0" />
                </Card>

                <Card>
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5" /> Saldo
                        </CardDescription>
                        <p className="text-[10px] text-muted-foreground/60 leading-snug">Resultado líquido do mês</p>
                        <CardTitle className={`text-xl font-bold tabular-nums ${saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {fmt(saldo)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0" />
                </Card>
            </div>
        </div>
    )
}
