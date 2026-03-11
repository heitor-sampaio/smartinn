'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProduto, updateProduto } from '@/actions/produtos'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function ProdutoForm({ produto, onSuccess }: { produto?: any, onSuccess: () => void }) {
    const [isLoading, setIsLoading] = useState(false)
    const [categoria, setCategoria] = useState(produto?.categoria || 'FRIGOBAR')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.set('categoria', categoria)

        const result = produto
            ? await updateProduto(produto.id, formData)
            : await createProduto(formData)

        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(result.success)
            onSuccess()
        }
    }

    // Input default monetario (evitando , / . chato no client state, usando apenas default value e let HTML handle)
    const formatReais = (val: number) => {
        return val !== undefined && val !== null ? val.toString().replace('.', ',') : ''
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid gap-2">
                <Label htmlFor="nome">Nome do item *</Label>
                <Input
                    id="nome"
                    name="nome"
                    placeholder="Ex: Água sem Gás 500ml"
                    defaultValue={produto?.nome}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="preco">Preço de venda (R$) *</Label>
                    <Input
                        id="preco"
                        name="preco"
                        placeholder="0,00"
                        defaultValue={produto ? formatReais(produto.preco) : ''}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="custo">Custo (R$)</Label>
                    <Input
                        id="custo"
                        name="custo"
                        placeholder="0,00"
                        defaultValue={produto?.custo != null ? formatReais(produto.custo) : ''}
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger id="categoria">
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="FRIGOBAR">Frigobar</SelectItem>
                        <SelectItem value="RESTAURANTE">Restaurante</SelectItem>
                        <SelectItem value="PASSEIO">Passeio</SelectItem>
                        <SelectItem value="SERVICO">Serviço/Taxa</SelectItem>
                        <SelectItem value="OUTRO">Outros</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="estoque">{produto ? 'Estoque Atual' : 'Estoque Inicial'} (Opcional)</Label>
                <Input
                    id="estoque"
                    name="estoque"
                    type="number"
                    min="0"
                    placeholder="Ex: 24"
                    defaultValue={produto?.estoque ?? ''}
                    disabled={categoria === 'PASSEIO' || categoria === 'SERVICO'}
                />
                <span className="text-xs text-muted-foreground">
                    {categoria === 'PASSEIO' || categoria === 'SERVICO'
                        ? 'Controle de estoque não se aplica a esta categoria.'
                        : 'Deixe em branco para não controlar estoque.'}
                </span>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição (Opcional)</Label>
                <Textarea
                    id="descricao"
                    name="descricao"
                    placeholder="Detalhes ou observações sobre o item..."
                    defaultValue={produto?.descricao || ''}
                    rows={3}
                />
            </div>

            <div className="pt-4 flex w-full justify-end">
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Item'}
                </Button>
            </div>
        </form>
    )
}
