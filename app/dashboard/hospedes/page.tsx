import { requireRole } from '@/lib/auth'
import { getHospedes } from '@/actions/hospedes'
import { HospedesClient } from './hospedes-client'

export const metadata = {
    title: 'Hóspedes - SmartInn',
}

export default async function HospedesPage() {
    await requireRole(['ADMIN', 'RECEPCIONISTA'])

    const { data, error } = await getHospedes()

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-bold text-red-500">Erro ao carregar Hóspedes</h2>
                <p className="text-muted-foreground">{error}</p>
            </div>
        )
    }

    // Passando os hóspedes hidratados do banco pro componente cliente renderizar a tabela
    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight">Hóspedes</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Cadastro e histórico de todos os hóspedes da pousada.</p>
                </div>
            </div>
            <HospedesClient initialData={data || []} />
        </div>
    )
}
