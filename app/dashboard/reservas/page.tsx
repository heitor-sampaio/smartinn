import { requireRole } from '@/lib/auth'
import { getReservas, getHospedesList, getAcomodacoesList } from '@/actions/reservas'
import { getProdutosList } from '@/actions/produtos'
import { getAjustes } from '@/actions/configuracoes'
import { getComodidades } from '@/actions/comodidades'
import { ReservasClient } from './reservas-client'

export const metadata = {
    title: 'Reservas - SmartInn',
}

export default async function ReservasPage() {
    const { pousadaId } = await requireRole(['ADMIN', 'RECEPCIONISTA'])

    const [reservasRes, hospedesRes, acomodacoesRes, produtosRes, pousadaConfig, comodidadesRes] = await Promise.all([
        getReservas(),
        getHospedesList(),
        getAcomodacoesList(),
        getProdutosList(),
        getAjustes(),
        getComodidades()
    ])

    if (reservasRes.error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-bold text-red-500">Erro ao carregar Reservas</h2>
                <p className="text-muted-foreground">{reservasRes.error}</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight">Reservas</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Gerencie reservas, check-ins e check-outs da pousada.</p>
                </div>
            </div>

            {/* Client Component cuida das Tabs, Tabela Rica e Dialog de Formulário */}
            <ReservasClient
                initialData={reservasRes.data || []}
                hospedesList={hospedesRes.data || []}
                acomodacoesList={acomodacoesRes.data || []}
                produtosList={produtosRes.data || []}
                comodidades={comodidadesRes.data || []}
                configPousada={pousadaConfig}
                pousadaId={pousadaId}
            />
        </div>
    )
}
