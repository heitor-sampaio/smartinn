'use client'

import { useState, useEffect } from 'react'
import { getResumoCheckout, fazerCheckout } from '@/actions/reservas'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2, DoorOpen } from 'lucide-react'
import { toast } from 'sonner'

interface CheckoutModalProps {
    reservaId: string | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CheckoutModal({ reservaId, isOpen, onOpenChange, onSuccess }: CheckoutModalProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [resumo, setResumo] = useState<any>(null)

    const [formaPagamento, setFormaPagamento] = useState('PIX')
    const [tipoDesconto, setTipoDesconto] = useState<'VALOR' | 'PERCENTUAL'>('VALOR')
    const [descontoValor, setDescontoValor] = useState('')

    const [observacao, setObservacao] = useState('')

    useEffect(() => {
        let mounted = true
        async function fetchResumo() {
            if (!reservaId || !isOpen) return
            setIsLoading(true)
            const result = await getResumoCheckout(reservaId)
            if (mounted) {
                if (result?.error) {
                    toast.error(result.error)
                    onOpenChange(false)
                } else {
                    setResumo(result.data)
                    // Se já houvessem extras na reserva salvo antes
                    if (result.data?.extras) {
                        // Nessa versão 1 faremos inclusão direta na hora do checkout. 
                        // Futuramente pode ser pre-populado.
                    }
                }
                setIsLoading(false)
            }
        }
        fetchResumo()
        return () => { mounted = false; setResumo(null); setObservacao('') }
    }, [reservaId, isOpen])

    async function handleConfirmCheckout() {
        if (!reservaId) return
        setIsSubmitting(true)

        // Calcula desconto que será enviado pro banco (baseado no input local da modal)
        const valorOriginalHospedagem = resumo?.valorTotal || 0
        const consumos = resumo?.extras || [] // consumos
        const totalExtras = consumos.reduce((acc: number, curr: any) => acc + (curr.valor * curr.quantidade), 0)
        const subtotal = valorOriginalHospedagem + totalExtras

        let descontoCalculado = 0
        const descInput = parseFloat(descontoValor.replace(',', '.')) || 0
        if (tipoDesconto === 'VALOR') {
            descontoCalculado = descInput
        } else {
            descontoCalculado = subtotal * (descInput / 100)
        }
        if (descontoCalculado > subtotal) descontoCalculado = subtotal

        const result = await fazerCheckout(reservaId, formaPagamento, descontoCalculado, observacao)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            toast.success(result.success)
            onSuccess()
            onOpenChange(false)
        }
        setIsSubmitting(false)
    }

    if (!isOpen) return null

    // Cálculos Financeiros da Tela (Re-render)
    const valorOriginalHospedagem = resumo?.valorTotal || 0
    const consumos = resumo?.extras || []
    const totalExtras = consumos.reduce((acc: number, curr: any) => acc + (curr.valor * curr.quantidade), 0)

    const subtotal = valorOriginalHospedagem + totalExtras
    let descontoCalculado = 0
    const descInput = parseFloat(descontoValor.replace(',', '.')) || 0
    if (tipoDesconto === 'VALOR') {
        descontoCalculado = descInput
    } else {
        descontoCalculado = subtotal * (descInput / 100)
    }
    if (descontoCalculado > subtotal) descontoCalculado = subtotal

    const valorParaCobrar = subtotal - descontoCalculado

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Fechamento de Conta (Check-out)</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : resumo ? (
                    <div className="space-y-6 pt-4">
                        {/* Section: Resumo Hospedagem */}
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">Hóspede principal: {resumo.hospede.nome}</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-muted-foreground">Acomodação:</span> {resumo.acomodacao.nome}</div>
                                <div><span className="text-muted-foreground">Pax:</span> {resumo.totalHospedes} Hóspedes</div>
                                <div>
                                    <span className="text-muted-foreground">Check-in Original:</span><br />
                                    {new Date(resumo.dataCheckin).toLocaleDateString('pt-BR')}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Check-out (Hoje):</span><br />
                                    {new Date().toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t text-sm font-medium flex justify-between">
                                <span>Total em Diárias/Hospedagem:</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorOriginalHospedagem)}</span>
                            </div>
                        </div>

                        {/* Section: Resumo Consumo Extras */}
                        <div>
                            <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase">Consumo Registrado / Liminares</h4>

                            {consumos.length > 0 ? (
                                <ul className="space-y-2 border rounded-md p-2 bg-card">
                                    {consumos.map((extra: any, idx: number) => (
                                        <li key={idx} className="flex justify-between items-center text-sm">
                                            <div className="flex-1">
                                                <span className="font-medium">{extra.quantidade}x</span> {extra.descricao || extra.nomeOriginal}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-muted-foreground">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(extra.valor * extra.quantidade)}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                    <div className="border-t pt-2 mt-2 font-medium flex justify-between px-1 text-sm">
                                        <span>Total Consumo Extra:</span>
                                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExtras)}</span>
                                    </div>
                                </ul>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-2 border border-dashed rounded-md">Nenhum consumo adicional listado.</p>
                            )}
                        </div>

                        {/* Section: Pagamento e Desconto */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Forma de Pagamento</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formaPagamento}
                                    onChange={(e) => setFormaPagamento(e.target.value)}
                                >
                                    <option value="DINHEIRO">Dinheiro</option>
                                    <option value="PIX">Pix</option>
                                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                                    <option value="CARTAO_CREDITO_VISTA">Crédito à Vista</option>
                                    <option value="CARTAO_CREDITO_PARCELADO">Crédito Parcelado</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="text-xs">Desconto</Label>
                                    <div className="flex gap-1">
                                        <button type="button" className={`px-2 py-0.5 text-[0.65rem] rounded border transition-colors ${tipoDesconto === 'VALOR' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-input text-muted-foreground hover:bg-muted'}`} onClick={() => setTipoDesconto('VALOR')}>R$</button>
                                        <button type="button" className={`px-2 py-0.5 text-[0.65rem] rounded border transition-colors ${tipoDesconto === 'PERCENTUAL' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-input text-muted-foreground hover:bg-muted'}`} onClick={() => setTipoDesconto('PERCENTUAL')}>%</button>
                                    </div>
                                </div>
                                <Input
                                    type="number"
                                    step={tipoDesconto === 'VALOR' ? "0.50" : "1"}
                                    min="0"
                                    placeholder={tipoDesconto === 'VALOR' ? '0.00' : '0'}
                                    value={descontoValor}
                                    onChange={(e) => setDescontoValor(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Section: Obs Final */}
                        <div className="space-y-1">
                            <Label className="text-xs">Observações do Fechamento</Label>
                            <Textarea
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                                placeholder="Notas internas para o fluxo de caixa..."
                                rows={2}
                            />
                        </div>

                        {/* FINAL CALCULATION */}
                        <Separator />
                        <div className="flex flex-col gap-1 p-3 bg-slate-900 text-slate-50 rounded-lg">
                            {descontoCalculado > 0 && (
                                <div className="flex justify-between items-center text-sm text-red-300">
                                    <span>Desconto Aplicado:</span>
                                    <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(descontoCalculado)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xl font-bold">
                                <span>TOTAL A COBRAR</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorParaCobrar)}</span>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                        <span className="text-red-500 font-semibold text-lg">⚠️ Erro</span>
                        <p>Não foi possível carregar os dados desta reserva.</p>
                    </div>
                )}

                <DialogFooter className="mt-6 border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmCheckout}
                        disabled={isLoading || !resumo || isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DoorOpen className="mr-2 h-4 w-4" />}
                        Confirmar Pagamento e Liberar Quarto
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
