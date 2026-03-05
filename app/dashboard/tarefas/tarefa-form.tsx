'use client'

import { useState } from 'react'
import { createTarefa } from '@/actions/tarefas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'

export function TarefaForm({
    initialData,
    acomodacoesList,
    onSuccess
}: {
    initialData?: any,
    acomodacoesList: any[],
    onSuccess: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)

    async function onSubmit(formData: FormData) {
        setIsLoading(true)

        // MVP: Só suportamos Create de Tarefas pelo Modal. Edit será bloqueado pra simplificar fluxo.
        const result = await createTarefa(formData)

        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            toast.success(result.success)
            onSuccess()
        }
    }

    if (initialData) {
        return (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    A edição de Cards pelo painel ainda não está disponível no MVP.<br />
                    Por favor, exclua a tarefa e crie uma nova se necessário.
                </p>
                <Button variant="outline" onClick={onSuccess}>Fechar</Button>
            </div>
        )
    }

    return (
        <form action={onSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="titulo">O que precisa ser feito?</Label>
                <Input
                    id="titulo"
                    name="titulo"
                    placeholder="Ex: Arrumar cama, Trocar Lâmpada do Banheiro"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="tipo">Categoria</Label>
                    <Select name="tipo" defaultValue={"LIMPEZA"}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="LIMPEZA">Limpeza Diária</SelectItem>
                            <SelectItem value="PREPARACAO">Preparação (Check-in)</SelectItem>
                            <SelectItem value="MANUTENCAO">Manutenção / Reparo</SelectItem>
                            <SelectItem value="OUTRO">Outros</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="prioridade">Prioridade</Label>
                    <Select name="prioridade" defaultValue={"NORMAL"}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="BAIXA">Baixa</SelectItem>
                            <SelectItem value="NORMAL">Normal</SelectItem>
                            <SelectItem value="URGENTE" className="text-red-600 font-medium">Urgente</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="acomodacaoId">Quarto / Acomodação</Label>
                <Select name="acomodacaoId" defaultValue="no-room">
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="no-room" className="text-muted-foreground italic">Uso Geral da Pousada</SelectItem>
                        {acomodacoesList.map((ac) => (
                            <SelectItem key={ac.id} value={ac.id}>
                                {ac.nome} <span className="text-xs text-muted-foreground ml-1">({ac.status})</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Opcional. Se for uma limpeza, o quarto ficará "Disponível" quando a tarefa for concluída.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="descricao">Detalhes adicionais</Label>
                <Textarea
                    id="descricao"
                    name="descricao"
                    placeholder="Adicione informações para a equipe... (Opcional)"
                    className="resize-none"
                    rows={3}
                />
            </div>

            <div className="flex justify-end pt-4 gap-2 border-t">
                <Button variant="outline" type="button" onClick={onSuccess}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Criando Ticket...' : 'Criar Tarefa'}
                </Button>
            </div>
        </form>
    )
}
