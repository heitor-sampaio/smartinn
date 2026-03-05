import { getTarefasList } from '@/actions/tarefas'
import { getAcomodacoesList } from '@/actions/reservas' // Reuso de listagem otimizada
import { TarefasClient } from './tarefas-client'

export const metadata = {
    title: 'Tarefas e Manutenção | PousadaApp'
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
        <div className="flex flex-col gap-6 p-6 h-[calc(100vh-4rem)]">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tarefas da Equipe</h1>
                <p className="text-muted-foreground mt-2">
                    Painel operacional para camareiras e manutenção. Controle Limpeza, Reparos e Preparação.
                </p>
            </div>

            {/* O Painel client-side ocupará o restante da altura da tela */}
            <div className="flex-1 overflow-hidden">
                <TarefasClient initialData={tarefas} acomodacoesList={acomodacoes} pousadaId={pousadaId} />
            </div>
        </div>
    )
}
