import { requireRole } from '@/lib/auth'
import { getAcomodacoes } from '@/actions/acomodacoes'
import { getComodidades } from '@/actions/comodidades'
import { AcomodacoesClient } from './acomodacoes-client'

export const metadata = {
    title: 'Acomodações - SmartInn',
}

export default async function AcomodacoesPage() {
    const { pousadaId } = await requireRole(['ADMIN', 'RECEPCIONISTA'])

    const [{ data, error }, { data: comodidades }] = await Promise.all([
        getAcomodacoes(),
        getComodidades()
    ])

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-bold text-red-500">Erro ao carregar acomodações</h2>
                <p className="text-muted-foreground">{error}</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight">Acomodações</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Gerencie os quartos, cabanas e unidades disponíveis na pousada.</p>
                </div>
            </div>
            <AcomodacoesClient initialData={data || []} comodidades={comodidades || []} pousadaId={pousadaId} />
        </div>
    )
}
