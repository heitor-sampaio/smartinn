import { getAcomodacoes } from '@/actions/acomodacoes'
import { AcomodacoesClient } from './acomodacoes-client'

export const metadata = {
    title: 'Acomodações - SmartInn',
}

export default async function AcomodacoesPage() {
    const { data, error } = await getAcomodacoes()

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-bold text-red-500">Erro ao carregar acomodações</h2>
                <p className="text-muted-foreground">{error}</p>
            </div>
        )
    }

    // Passamos as acomodações hidratadas do banco pro componente cliente renderizar a tabela
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Acomodações</h2>
            </div>
            <AcomodacoesClient initialData={data || []} />
        </div>
    )
}
