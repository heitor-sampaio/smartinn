import { useState } from 'react'
import { createLancamento } from '@/actions/financeiro'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function LancamentoForm({ onSuccess }: { onSuccess: () => void }) {
    const [isLoading, setIsLoading] = useState(false)
    const [tipoSelecionado, setTipoSelecionado] = useState<string>('ENTRADA')

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await createLancamento(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            toast.success(result.success)
            onSuccess()
        }
    }

    const defaultDate = format(new Date(), 'yyyy-MM-dd')

    return (
        <form action={onSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Movimento</Label>
                    <Select name="tipo" required value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ENTRADA">Entrada (Receita)</SelectItem>
                            <SelectItem value="SAIDA">Saída (Despesa)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="data">Data de Ocorrência</Label>
                    <Input id="data" name="data" type="date" required defaultValue={defaultDate} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input id="descricao" name="descricao" placeholder="Ex: Conta de Luz (Abril), Venda de Frigobar" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                    <Select name="formaPagamento" required>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                            <SelectItem value="PIX">Pix</SelectItem>
                            <SelectItem value="TRANSFERENCIA">Transferência Bancária</SelectItem>
                            <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
                            <SelectItem value="CARTAO_CREDITO_VISTA">Cartão de Crédito à Vista</SelectItem>
                            <SelectItem value="CARTAO_CREDITO_PARCELADO">Cartão de Crédito Parcelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="valor">Valor (R$)</Label>
                    <Input id="valor" name="valor" type="number" step="0.01" min="0" placeholder="0.00" required />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">

                <div className="space-y-2">
                    <Label htmlFor="categoria">Plano / Categoria</Label>
                    <Select name="categoria">
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {tipoSelecionado === 'ENTRADA' ? (
                                <>
                                    <SelectItem value="HOSPEDAGEM">Hospedagem (Diárias)</SelectItem>
                                    <SelectItem value="CONSUMO">Consumo (Frigobar/Serviços)</SelectItem>
                                    <SelectItem value="OUTRO">Outras Receitas</SelectItem>
                                </>
                            ) : (
                                <>
                                    <SelectItem value="AGUA">Água</SelectItem>
                                    <SelectItem value="ENERGIA">Energia</SelectItem>
                                    <SelectItem value="INTERNET">Internet / Telefonia</SelectItem>
                                    <SelectItem value="ALIMENTACAO">Alimentos / Bebidas (Estoque)</SelectItem>
                                    <SelectItem value="FUNCIONARIOS">Salários / Terceiros</SelectItem>
                                    <SelectItem value="MANUTENCAO">Manutenção / Reparos</SelectItem>
                                    <SelectItem value="AMENIDADES">Amenidades / Limpeza</SelectItem>
                                    <SelectItem value="IMPOSTOS">Impostos / Taxas</SelectItem>
                                    <SelectItem value="MARKETING">Marketing / Vendas</SelectItem>
                                    <SelectItem value="OUTRO">Outras Despesas</SelectItem>
                                </>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Extras</Label>
                <Textarea
                    id="observacoes"
                    name="observacoes"
                    placeholder="Detalhes adicionais, comprovantes..."
                    className="resize-none"
                    rows={2}
                />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" type="button" onClick={onSuccess}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Registrando...' : 'Salvar no Caixa'}
                </Button>
            </div>
        </form>
    )
}
