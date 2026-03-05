'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { addConsumoReserva } from '@/actions/reservas';
import { Loader2, Plus, ShoppingCart, Info } from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { DialogFooter } from '@/components/ui/dialog';

export function ConsumoModal({
    reservaId,
    produtosList,
    onSuccess,
    onCancel
}: {
    reservaId: string;
    produtosList: any[];
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);

    // Modo de Inserção: Catálogo vs Avulso
    const [modoInsercao, setModoInsercao] = useState<'CATALOGO' | 'AVULSO'>('CATALOGO');

    // Select state pros Itens Baseados no BD
    const [openCombobox, setOpenCombobox] = useState(false);
    const [selectedProdutoId, setSelectedProdutoId] = useState<string | null>(null);

    // Inputs puros (Livre e Quantidade)
    const [nomeLivre, setNomeLivre] = useState('');
    const [valorLivre, setValorLivre] = useState('');
    const [quantidade, setQuantidade] = useState(1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (modoInsercao === 'CATALOGO' && !selectedProdutoId) {
                toast.error("Selecione um produto do catálogo.");
                setIsLoading(false);
                return;
            }

            if (modoInsercao === 'AVULSO' && (!nomeLivre || !valorLivre)) {
                toast.error("Preencha o nome e o valor do item avulso.");
                setIsLoading(false);
                return;
            }

            const valorFinal = modoInsercao === 'AVULSO'
                ? parseFloat(valorLivre.replace(',', '.'))
                : 0; // Se for Catalogo o backend sobrescreve pelo ID anyway

            if (modoInsercao === 'AVULSO' && (isNaN(valorFinal) || valorFinal < 0)) {
                toast.error("Valor inválido.");
                setIsLoading(false);
                return;
            }

            const result = await addConsumoReserva(reservaId, {
                produtoId: modoInsercao === 'CATALOGO' ? (selectedProdutoId as string) : undefined,
                nomeAvulso: modoInsercao === 'AVULSO' ? nomeLivre : undefined,
                valorUnitario: valorFinal,
                quantidade
            });

            if (result.error) throw new Error(result.error);

            toast.success(result.success);
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || "Falha ao enviar consumo.");
        } finally {
            setIsLoading(false);
        }
    };

    const produtoSelecionadoObj = produtosList.find(p => p.id === selectedProdutoId);

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="flex bg-muted/50 p-1 rounded-md mb-4 gap-1">
                <Button
                    type="button"
                    variant={modoInsercao === 'CATALOGO' ? 'secondary' : 'ghost'}
                    className={cn("w-1/2", modoInsercao === 'CATALOGO' ? "bg-background shadow-sm hover:bg-background" : "")}
                    onClick={() => setModoInsercao('CATALOGO')}
                >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Catálogo
                </Button>
                <Button
                    type="button"
                    variant={modoInsercao === 'AVULSO' ? 'secondary' : 'ghost'}
                    className={cn("w-1/2", modoInsercao === 'AVULSO' ? "bg-background shadow-sm hover:bg-background" : "")}
                    onClick={() => setModoInsercao('AVULSO')}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Item Avulso
                </Button>
            </div>

            {modoInsercao === 'CATALOGO' ? (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Buscar Produto/Serviço *</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between font-normal text-left h-auto min-h-10"
                                >
                                    {produtoSelecionadoObj ? (
                                        <div className="flex flex-col items-start gap-1">
                                            <span>{produtoSelecionadoObj.nome}</span>
                                            <span className="text-xs text-muted-foreground font-semibold">
                                                R$ {Number(produtoSelecionadoObj.preco).toFixed(2).replace('.', ',')}
                                            </span>
                                        </div>
                                    ) : (
                                        "Selecione o Item..."
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Ex: Água, Passeio..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            {produtosList.filter(p => p.ativo).map((p) => (
                                                <CommandItem
                                                    key={p.id}
                                                    value={`${p.nome} ${p.categoria}`}
                                                    onSelect={() => {
                                                        setSelectedProdutoId(p.id);
                                                        setOpenCombobox(false);
                                                    }}
                                                    disabled={p.estoque !== null && p.estoque <= 0}
                                                >
                                                    <Check
                                                        className={cn("mr-2 h-4 w-4", selectedProdutoId === p.id ? "opacity-100" : "opacity-0")}
                                                    />
                                                    <div className="flex justify-between w-full pr-2">
                                                        <span>{p.nome}</span>
                                                        <span className="font-semibold text-muted-foreground ml-2">R$ {Number(p.preco).toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {produtoSelecionadoObj && produtoSelecionadoObj.estoque !== null && (
                            <div className="text-xs text-muted-foreground">
                                Estoque atual: <strong>{produtoSelecionadoObj.estoque} disponíveis</strong>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label>Nome do Item Avulso *</Label>
                        <Input
                            placeholder="Ex: Diária Extra (late checkout)"
                            value={nomeLivre}
                            onChange={(e) => setNomeLivre(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label>Valor Unitário (R$) *</Label>
                        <Input
                            placeholder="0,00"
                            value={valorLivre}
                            onChange={(e) => setValorLivre(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade *</Label>
                    <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        value={quantidade}
                        onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                        required
                    />
                </div>

                {produtoSelecionadoObj && (
                    <div className="flex flex-col items-end justify-center pt-[1.5rem]">
                        <span className="text-xs text-muted-foreground">Subtotal desse item:</span>
                        <span className="text-lg font-bold text-primary">
                            R$ {(Number(produtoSelecionadoObj.preco) * quantidade).toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                )}
            </div>

            {/* Informativo de Estoque Automático */}
            {modoInsercao === 'CATALOGO' && produtoSelecionadoObj?.estoque !== null && (
                <div className="flex items-start bg-blue-50 border border-blue-200 p-3 rounded-md mt-2">
                    <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800 ml-2">
                        Atenção: Ao clicar em "Lançar Consumo", o estoque geral deste item será reduzido e não pode ser desfeito senão deletando o consumo do quarto.
                    </div>
                </div>
            )}

            <DialogFooter className="pt-4 border-t w-full">
                <Button type="button" variant="outline" onClick={onCancel} className="mr-auto sm:mr-0">
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || (modoInsercao === 'CATALOGO' && !selectedProdutoId)}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Lançar Consumo'}
                </Button>
            </DialogFooter>
        </form>
    );
}
