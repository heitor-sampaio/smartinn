'use client'

import { useState } from 'react'
import { createAcomodacao, updateAcomodacao } from '@/actions/acomodacoes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

export function AcomodacaoForm({
    initialData,
    onSuccess
}: {
    initialData?: any,
    onSuccess: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)

    async function onSubmit(formData: FormData) {
        setIsLoading(true)

        let result;
        if (initialData?.id) {
            // Envio do ID pro update é feito por fora do formData pra segurança
            result = await updateAcomodacao(initialData.id, formData)
        } else {
            result = await createAcomodacao(formData)
        }

        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            toast.success(result.success)
            onSuccess()
        }
    }

    return (
        <form action={onSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="nome">Identificação (Nome ou Número)</Label>
                <Input
                    id="nome"
                    name="nome"
                    placeholder="Ex: Quarto 12, Suíte Master"
                    defaultValue={initialData?.nome}
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select name="tipo" defaultValue={initialData?.tipo || "STANDARD"}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="STANDARD">Standard</SelectItem>
                            <SelectItem value="LUXO">Luxo</SelectItem>
                            <SelectItem value="SUITE">Suíte</SelectItem>
                            <SelectItem value="FAMILIA">Família</SelectItem>
                            <SelectItem value="CHALE">Chalé</SelectItem>
                            <SelectItem value="OUTRO">Outro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="capacidade">Capacidade</Label>
                    <Input
                        id="capacidade"
                        name="capacidade"
                        type="number"
                        min={1}
                        max={20}
                        defaultValue={initialData?.capacidade || 2}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="valorDiaria">Diária Base (R$)</Label>
                    <Input
                        id="valorDiaria"
                        name="valorDiaria"
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="Ex: 150.00"
                        defaultValue={initialData?.valorDiaria || ''}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (Opcional)</Label>
                <Input
                    id="descricao"
                    name="descricao"
                    placeholder="Ex: Cama Queen, Ar Condicionado e Frigobar."
                    defaultValue={initialData?.descricao}
                />
            </div>

            <div className="space-y-3 pt-2 pb-2">
                <Label>Características e Comodidades</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-muted/30 p-4 rounded-md border">
                    {['Ar condicionado', 'Aquecedor', 'Banheira', 'Cofre', 'Frigobar', 'Lareira', 'Microondas', 'Televisão', 'Vista panorâmica'].map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                                id={`feat-${item}`}
                                name="caracteristicas"
                                value={item}
                                defaultChecked={initialData?.caracteristicas?.includes(item)}
                            />
                            <label
                                htmlFor={`feat-${item}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {item}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {initialData?.id && (
                <div className="space-y-2">
                    <Label htmlFor="status">Status Atual</Label>
                    <Select name="status" defaultValue={initialData?.status}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DISPONIVEL">Disponível</SelectItem>
                            <SelectItem value="OCUPADO">Ocupado</SelectItem>
                            <SelectItem value="LIMPEZA">Em Limpeza</SelectItem>
                            <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                            <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex justify-end pt-4 gap-2">
                <Button variant="outline" type="button" onClick={onSuccess}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : 'Salvar Acomodação'}
                </Button>
            </div>
        </form>
    )
}
