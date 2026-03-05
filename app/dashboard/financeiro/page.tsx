import { getLancamentosList } from '@/actions/financeiro'
import { FinanceiroClient } from './financeiro-client'
import { MonthSelector } from './month-selector'

export const metadata = {
    title: 'Financeiro - PousadaApp',
}

export default async function FinanceiroPage({
    searchParams
}: {
    searchParams: { mes?: string, ano?: string }
}) {
    const dataAtual = new Date()
    const mes = searchParams.mes ? parseInt(searchParams.mes) : dataAtual.getMonth() + 1
    const ano = searchParams.ano ? parseInt(searchParams.ano) : dataAtual.getFullYear()

    const { data, error } = await getLancamentosList(mes, ano)

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-bold text-red-500">Erro ao carregar o Financeiro</h2>
                <p className="text-muted-foreground">{error}</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 pb-4">
                <h2 className="text-3xl font-bold tracking-tight">Caixa e Lançamentos</h2>
                <MonthSelector mesAtual={mes} anoAtual={ano} />
            </div>

            <FinanceiroClient initialData={data || []} />
        </div>
    )
}
