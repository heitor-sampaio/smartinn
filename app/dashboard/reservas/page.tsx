import { getReservas, getHospedesList, getAcomodacoesList } from '@/actions/reservas'
import { getProdutosList } from '@/actions/produtos'
import { getAjustes } from '@/actions/configuracoes'
import { ReservasClient } from './reservas-client'

export const metadata = {
    title: 'Reservas - SmartInn',
}

export default async function ReservasPage() {
    // Vamos buscar em paralelo as reservas Atuais e também as listas pros combos do Form e Consumo
    const [reservasRes, hospedesRes, acomodacoesRes, produtosRes, pousadaConfig] = await Promise.all([
        getReservas(),
        getHospedesList(),
        getAcomodacoesList(),
        getProdutosList(),
        getAjustes()
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
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Reservas</h2>
            </div>

            {/* Client Component cuida das Tabs, Tabela Rica e Dialog de Formulário */}
            <ReservasClient
                initialData={reservasRes.data || []}
                hospedesList={hospedesRes.data || []}
                acomodacoesList={acomodacoesRes.data || []}
                produtosList={produtosRes.data || []}
                configPousada={pousadaConfig}
            />
        </div>
    )
}
