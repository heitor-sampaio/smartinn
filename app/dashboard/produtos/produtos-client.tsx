'use client'

import { useState } from 'react'
import { Plus, Package, Store, Coffee, Map, Wrench, PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { deleteProduto, toggleStatusProduto } from '@/actions/produtos'
import { ProdutoForm } from './produto-form'

export function ProdutosClient({ initialData }: { initialData: any[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProduto, setEditingProduto] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState<string>('TODAS')

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

                <div className="flex overflow-x-auto gap-2 w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
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

                    return (
                        <Card key={item.id} className={`overflow-hidden transition-all ${!item.ativo ? 'opacity-60 saturate-50' : ''}`}>
                            <CardContent className="p-5 flex flex-col h-full relative">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge variant="outline" className={`flex items-center gap-1 border-0 ${cfg.color}`}>
                                        <Icon className="w-3 h-3" />
                                        {cfg.label}
                                    </Badge>
                                    <div className="text-lg font-bold">
                                        R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                                    </div>
                                </div>

                                <h3 className="font-semibold text-lg line-clamp-1">{item.nome}</h3>
                                {item.descricao && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 min-h-10">
                                        {item.descricao}
                                    </p>
                                )}

                                <div className="mt-auto pt-4 flex gap-2 w-full items-center justify-between border-t border-border/50">
                                    <div className="text-xs text-muted-foreground font-medium">
                                        {item.estoque !== null ? `Estoque: ${item.estoque}` : ''}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs px-2 h-8"
                                            onClick={() => handleToggleStatus(item.id, item.ativo)}
                                        >
                                            {item.ativo ? 'Desativar' : 'Reativar'}
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="text-xs px-3 h-8"
                                            onClick={() => openEditDialog(item)}
                                        >
                                            Editar
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-destructive hover:bg-destructive/10 px-2 h-8"
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
        </div>
    )
}
