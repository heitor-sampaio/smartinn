'use client'

import { useState } from 'react'
import { Plus, Package, Store, Coffee, Map, Wrench, PackageSearch, Boxes, TrendingUp, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { deleteProduto, toggleStatusProduto, ajustarEstoque } from '@/actions/produtos'
import { ProdutoForm } from './produto-form'

export function ProdutosClient({ initialData, totalAcomodacoes }: { initialData: any[], totalAcomodacoes: number }) {
    const limiteEstoque = totalAcomodacoes * 7 // 1 unidade por quarto por dia durante 7 dias
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProduto, setEditingProduto] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState<string>('TODAS')

    // Controle de estoque
    const [estoqueDialog, setEstoqueDialog] = useState<{ open: boolean; produto: any | null }>({ open: false, produto: null })
    const [estoqueInput, setEstoqueInput] = useState('')
    const [savingEstoque, setSavingEstoque] = useState(false)

    const filtered = initialData.filter(p => {
        const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.descricao?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        const matchesCategory = filterCategory === 'TODAS' || p.categoria === filterCategory

        return matchesSearch && matchesCategory;
    })

    const handleDelete = async (id: string) => {
        const result = await deleteProduto(id)
        if (result.error) toast.error(result.error)
        else toast.success(result.success)
    }

    const handleToggleStatus = async (id: string, atual: boolean) => {
        const promise = toggleStatusProduto(id, atual)
        toast.promise(promise, {
            loading: 'Atualizando disponibilidade...',
            success: (msg) => msg.success,
            error: (err) => err.error
        })
    }

    const openCreateDialog = () => {
        setEditingProduto(null)
        setIsDialogOpen(true)
    }

    const openEditDialog = (produto: any) => {
        setEditingProduto(produto)
        setIsDialogOpen(true)
    }

    const openEstoqueDialog = (produto: any) => {
        setEstoqueInput(produto.estoque?.toString() ?? '0')
        setEstoqueDialog({ open: true, produto })
    }

    const handleSalvarEstoque = async () => {
        if (!estoqueDialog.produto) return
        const novoEstoque = parseInt(estoqueInput, 10)
        if (isNaN(novoEstoque) || novoEstoque < 0) {
            toast.error('Informe um valor de estoque válido (número ≥ 0).')
            return
        }
        setSavingEstoque(true)
        const result = await ajustarEstoque(estoqueDialog.produto.id, novoEstoque)
        setSavingEstoque(false)
        if (result.error) toast.error(result.error)
        else {
            toast.success(result.success)
            setEstoqueDialog({ open: false, produto: null })
        }
    }

    const categoriasConfig: Record<string, { label: string, icon: any, color: string }> = {
        FRIGOBAR: { label: 'Frigobar', icon: Package, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
        RESTAURANTE: { label: 'Restaurante', icon: Coffee, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
        PASSEIO: { label: 'Passeio', icon: Map, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
        SERVICO: { label: 'Serviço', icon: Wrench, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
        OUTRO: { label: 'Outros', icon: Store, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex w-full gap-2 sm:max-w-md">
                    <div className="relative flex-1">
                        <PackageSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar produtos..."
                            type="search"
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {['TODAS', 'FRIGOBAR', 'RESTAURANTE', 'PASSEIO', 'SERVICO'].map((cat) => (
                        <Button
                            key={cat}
                            variant={filterCategory === cat ? 'default' : 'outline'}
                            size="sm"
                            className="whitespace-nowrap rounded-full cursor-pointer"
                            onClick={() => setFilterCategory(cat)}
                        >
                            {cat === 'TODAS' ? 'Todos' : categoriasConfig[cat]?.label}
                        </Button>
                    ))}
                    <Button onClick={openCreateDialog} size="sm" className="hidden sm:flex whitespace-nowrap">
                        <Plus className="mr-2 h-4 w-4" /> Cadastrar Produto
                    </Button>
                </div>

                {/* Mobile Button add */}
                <Button onClick={openCreateDialog} className="w-full sm:hidden">
                    <Plus className="mr-2 h-4 w-4" /> Novo Produto
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => {
                    const cfg = categoriasConfig[item.categoria] || categoriasConfig['OUTRO']
                    const Icon = cfg.icon
                    const estoqueAbaixoLimite = item.estoque !== null && limiteEstoque > 0 && item.estoque < limiteEstoque

                    return (
                        <Card key={item.id} className={`overflow-hidden transition-all ${!item.ativo ? 'opacity-60 saturate-50' : ''} ${estoqueAbaixoLimite ? 'border-amber-400 dark:border-amber-500' : ''}`}>
                            <CardContent className="p-3 md:p-4 flex flex-col h-full relative">
                                <div className="flex justify-between items-start mb-2 md:mb-3">
                                    <Badge variant="outline" className={`flex items-center gap-1 border-0 text-xs ${cfg.color}`}>
                                        <Icon className="w-3 h-3" />
                                        {cfg.label}
                                    </Badge>
                                    <div className="text-base md:text-lg font-bold">
                                        R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                                    </div>
                                </div>

                                <h3 className="font-semibold text-sm md:text-lg line-clamp-1">{item.nome}</h3>
                                {item.descricao && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {item.descricao}
                                    </p>
                                )}

                                        {/* Custo e margem */}
                                {item.custo != null && (
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-xs text-muted-foreground">Custo: R$ {Number(item.custo).toFixed(2).replace('.', ',')}</span>
                                        {item.preco > 0 && (
                                            <span className="text-xs flex items-center gap-0.5 text-emerald-600 font-medium">
                                                <TrendingUp className="h-3 w-3" />
                                                {(((item.preco - item.custo) / item.preco) * 100).toFixed(0)}% margem
                                            </span>
                                        )}
                                    </div>
                                )}

                                {estoqueAbaixoLimite && (
                                    <div className={`flex items-start gap-1.5 mt-2 text-xs px-2 py-1.5 rounded-md ${item.estoque === 0 ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                                        <TriangleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        <span>
                                            {item.estoque === 0
                                                ? 'Estoque zerado.'
                                                : `Estoque abaixo do mínimo.`
                                            }
                                            {' '}Recomendado: <strong>{limiteEstoque} un.</strong> ({totalAcomodacoes} quartos × 7 dias)
                                        </span>
                                    </div>
                                )}

                                <div className="mt-auto pt-2 md:pt-3 flex gap-2 w-full items-center justify-between border-t border-border/50">
                                    {/* Estoque badge */}
                                    {item.estoque !== null ? (
                                        <button
                                            onClick={() => openEstoqueDialog(item)}
                                            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border transition-colors ${
                                                item.estoque === 0
                                                    ? 'border-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60'
                                                    : estoqueAbaixoLimite
                                                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60'
                                                        : 'border-border/60 hover:bg-muted/60'
                                            }`}
                                            title={
                                                item.estoque === 0
                                                    ? 'Estoque zerado!'
                                                    : estoqueAbaixoLimite
                                                        ? `Estoque baixo — mínimo recomendado: ${limiteEstoque} un. (${totalAcomodacoes} quartos × 7 dias)`
                                                        : 'Clique para ajustar o estoque'
                                            }
                                        >
                                            {estoqueAbaixoLimite
                                                ? <TriangleAlert className={`h-3.5 w-3.5 ${item.estoque === 0 ? 'text-red-500' : 'text-amber-500'}`} />
                                                : <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
                                            }
                                            <span className={
                                                item.estoque === 0 ? 'text-red-600 dark:text-red-400 font-bold' :
                                                estoqueAbaixoLimite ? 'text-amber-700 dark:text-amber-400 font-semibold' :
                                                'text-foreground'
                                            }>
                                                {item.estoque} un.
                                            </span>
                                        </button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground/50">Sem controle</span>
                                    )}

                                    <div className="flex items-center gap-1 md:gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs px-2 h-7"
                                            onClick={() => handleToggleStatus(item.id, item.ativo)}
                                        >
                                            {item.ativo ? 'Desativar' : 'Reativar'}
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="text-xs px-2 h-7"
                                            onClick={() => openEditDialog(item)}
                                        >
                                            Editar
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-destructive hover:bg-destructive/10 px-2 h-7"
                                            onClick={() => {
                                                if (window.confirm("Deseja realmente excluir este produto? Histórico relacionado pode ser perdido.")) {
                                                    handleDelete(item.id)
                                                }
                                            }}
                                        >
                                            Excluir
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {filtered.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                        <PackageSearch className="mx-auto h-12 w-12 opacity-50 mb-3" />
                        <p>Nenhum produto ou serviço encontrado.</p>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingProduto ? 'Editar Produto ou Serviço' : 'Novo Produto ou Serviço'}</DialogTitle>
                    </DialogHeader>
                    <ProdutoForm
                        produto={editingProduto}
                        onSuccess={() => setIsDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog de ajuste de estoque */}
            <Dialog open={estoqueDialog.open} onOpenChange={(open) => !open && setEstoqueDialog({ open: false, produto: null })}>
                <DialogContent className="sm:max-w-[320px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Boxes className="h-5 w-5" /> Ajustar Estoque
                        </DialogTitle>
                        <DialogDescription>
                            {estoqueDialog.produto?.nome}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="novoEstoque">Quantidade atual em estoque</Label>
                            <Input
                                id="novoEstoque"
                                type="number"
                                min="0"
                                value={estoqueInput}
                                onChange={(e) => setEstoqueInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSalvarEstoque()}
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEstoqueDialog({ open: false, produto: null })}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSalvarEstoque} disabled={savingEstoque}>
                                {savingEstoque ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
