import { getTarefasList } from '@/actions/tarefas'
import { getAcomodacoesList } from '@/actions/reservas' // Reuso de listagem otimizada
import { TarefasClient } from './tarefas-client'

export const metadata = {
    title: 'Tarefas e Manutenção | SmartInn'
}

export default async function TarefasPage() {
    // Busca paralela para alimentar o Kanban Principal e os Selects do Form
    const [tarefasResponse, acomodacoesResponse] = await Promise.all([
        getTarefasList(),
        getAcomodacoesList()
    ])

    const tarefas = tarefasResponse.data || []
    const pousadaId = tarefasResponse.pousadaId || null
    const acomodacoes = acomodacoesResponse.data || []

    return (
        <div className="flex flex-col gap-4 md:h-[calc(100vh-4rem)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight">Tarefas da Equipe</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Painel operacional para camareiras e manutenção. Controle Limpeza, Reparos e Preparação.
                    </p>
                </div>
            </div>

            {/* Mobile: sem overflow-hidden para que colunas cresçam. Desktop: mantém contenção */}
            <div className="flex-1 md:overflow-hidden">
                <TarefasClient initialData={tarefas} acomodacoesList={acomodacoes} pousadaId={pousadaId ?? undefined} />
            </div>
        </div>
    )
}
