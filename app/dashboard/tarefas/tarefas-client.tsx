'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Clock, AlertTriangle, Hammer, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TarefaForm } from './tarefa-form'
import { deleteTarefa, updateStatusTarefa } from '@/actions/tarefas'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function TarefasClient({ initialData, acomodacoesList, isEquipeMode, pousadaId, linkEquipe }: { initialData: any[], acomodacoesList?: any[], isEquipeMode?: boolean, pousadaId?: string, linkEquipe?: string }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTarefa, setEditingTarefa] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        if (!pousadaId) return;

        const supabase = createClient()

        const channel = supabase.channel('realtime_tarefas')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tarefas'
                },
                (payload: any) => {
                    console.log('Realtime Event Received:', payload)

                    // Supabase Postgres usa aspas pra camelCase, o filtro lá falha. Filtramos no client:
                    const record = payload.new || payload.old
                    if (record && record.pousadaId !== pousadaId) {
                        return; // Ignora tarefas de outras pousadas
                    }

                    if (payload.eventType === 'INSERT') {
                        const audio = new Audio('/notification.mp3')
                        audio.play().catch(e => console.log('Áudio autoplay bloquedo:', e))
                        toast.info('Nova tarefa recebida!')
                    } else if (payload.eventType === 'UPDATE') {
                        toast.info('Uma tarefa foi atualizada.')
                    }

                    router.refresh()
                }
            )
            .subscribe((status) => {
                console.log('Supabase Channel Status:', status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [pousadaId, router])

    const openAdd = () => {
        setEditingTarefa(null)
        setIsDialogOpen(true)
    }

    const openEdit = (t: any) => {
        setEditingTarefa(t)
        setIsDialogOpen(true)
    }

    const handleUpdateStatus = async (id: string, novoStatus: string) => {
        const promise = updateStatusTarefa(id, novoStatus, isEquipeMode ? (linkEquipe) : undefined)
        toast.promise(promise, {
            loading: 'Movendo...',
            success: (result) => {
                if (result?.error) throw new Error(result.error)
                return result?.success || 'Feito!'
            },
            error: (e) => e.message || 'Erro ao mover.'
        })
    }

    const handleDelete = async (id: string) => {
        const promise = deleteTarefa(id)
        toast.promise(promise, {
            loading: 'Excluindo...',
            success: (result) => {
                if (result?.error) throw new Error(result.error)
                return result?.success || 'Excluída!'
            },
            error: (e) => e.message || 'Falha ao deletar.'
        })
    }

    // Separação de cards em "colunas" por Status
    const pendentes = initialData.filter(t => t.status === 'PENDENTE')
    const emAndamento = initialData.filter(t => t.status === 'EM_ANDAMENTO')
    const concluidas = initialData.filter(t => t.status === 'CONCLUIDA')

    const getTipoIconAndColor = (tipo: string) => {
        switch (tipo) {
            case 'LIMPEZA': return { icon: <Sparkles className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800' }
            case 'MANUTENCAO': return { icon: <Hammer className="w-4 h-4" />, color: 'bg-orange-100 text-orange-800' }
            case 'PREPARACAO': return { icon: <Clock className="w-4 h-4" />, color: 'bg-purple-100 text-purple-800' }
            default: return { icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-gray-100 text-gray-800' }
        }
    }

    const KanbanCard = ({ t }: { t: any }) => {
        const style = getTipoIconAndColor(t.tipo)

        return (
            <Card className={`relative shadow-sm transition-shadow hover:shadow-md ${t.prioridade === 'URGENTE' ? 'border-red-200' : ''}`}>
                {/* Etiqueta de Urgência */}
                {t.prioridade === 'URGENTE' && (
                    <div className="absolute -top-2 -right-2">
                        <Badge variant="destructive" className="shadow-sm">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Urgente
                        </Badge>
                    </div>
                )}

                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium ${style.color}`}>
                                {style.icon}
                                {t.tipo}
                            </span>
                            <h3 className="font-semibold text-sm line-clamp-2 mt-1">{t.titulo}</h3>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 pb-3 min-h-[85px] flex flex-col justify-between">
                    {t.acomodacaoId ? (
                        <div className="flex items-center gap-1 text-sm font-medium mt-1">
                            <span>🏠 {t.acomodacao?.nome || 'Quarto'}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <span>🏢 Geral (Pousada)</span>
                        </div>
                    )}

                    {t.descricao && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {t.descricao}
                        </p>
                    )}

                    {t.status === 'CONCLUIDA' && t.tempoGastoMinutos !== null && t.tempoGastoMinutos !== undefined && (
                        <div className="flex items-center gap-1 mt-3 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md w-fit">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-bold">Tempo Gasto: {t.tempoGastoMinutos} min</span>
                        </div>
                    )}

                    {t.status === 'EM_ANDAMENTO' && t.iniciadaEm && (
                        <div className="flex items-center gap-1 mt-3 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-md w-fit">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-medium">Iniciada às: {format(new Date(t.iniciadaEm), "HH:mm")}</span>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="p-3 pt-0 flex gap-2 border-t bg-muted/40 justify-between mt-auto">
                    {/* Botoes de Transição de Estado */}
                    <div className="flex w-full mt-2 justify-between">
                        <div className="flex space-x-1">
                            {t.status === 'PENDENTE' && (
                                <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus(t.id, 'EM_ANDAMENTO')}
                                    className="h-7 text-xs w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    Iniciar
                                </Button>
                            )}
                            {t.status === 'EM_ANDAMENTO' && (
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleUpdateStatus(t.id, 'CONCLUIDA')}
                                    className="h-7 text-xs w-full bg-green-600 hover:bg-green-700"
                                >
                                    Concluir
                                </Button>
                            )}
                        </div>

                        {!isEquipeMode && (
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => openEdit(t)}>
                                    Editar
                                </Button>
                                {t.status !== 'EM_ANDAMENTO' && (
                                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-red-600 hover:text-red-700" onClick={() => handleDelete(t.id)}>
                                        Excluir
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </CardFooter>
            </Card>
        )
    }

    const Column = ({ title, count, tasks, badgeColor }: any) => (
        <div className="flex flex-col bg-muted/50 rounded-lg border h-full overflow-hidden">
            <div className={`p-3 border-b bg-background/50 flex items-center justify-between font-medium`}>
                <span>{title}</span>
                <Badge variant="secondary" className={`${badgeColor}`}>{count}</Badge>
            </div>
            {/* Area Scrolavel dos Cards */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2 p-4 text-center">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nada por aqui</p>
                    </div>
                ) : (
                    tasks.map((task: any) => <KanbanCard key={task.id} t={task} />)
                )}
            </div>
        </div>
    )

    return (
        <div className="h-full flex flex-col">
            {!isEquipeMode && (
                <div className="flex justify-end mb-4 shrink-0">
                    <Button onClick={openAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
                    </Button>
                </div>
            )}

            {/* Layout Flex para Mobile (Column) e Desktop (Grid com Colunas lado a lado) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-0">

                <Column
                    title="Pendente"
                    count={pendentes.length}
                    tasks={pendentes}
                    badgeColor="bg-slate-200 text-slate-800"
                />

                <Column
                    title="Em Andamento"
                    count={emAndamento.length}
                    tasks={emAndamento}
                    badgeColor="bg-blue-200 text-blue-800"
                />

                <Column
                    title="Concluída (Hoje)"
                    count={concluidas.length}
                    tasks={concluidas.filter((c: any) => new Date(c.concluidaEm).toDateString() === new Date().toDateString())}
                    badgeColor="bg-green-200 text-green-800"
                />

            </div>

            {/* Modal de Criação */}
            {!isEquipeMode && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingTarefa ? 'Editar Tarefa' : 'Nova Solicitação'}</DialogTitle>
                        </DialogHeader>
                        <TarefaForm
                            initialData={editingTarefa}
                            acomodacoesList={acomodacoesList!}
                            onSuccess={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
