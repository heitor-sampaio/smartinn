'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AcomodacaoForm } from './acomodacao-form'
import { deleteAcomodacao, toggleStatusAcomodacao } from '@/actions/acomodacoes'
import { toast } from 'sonner'

export function AcomodacoesClient({ initialData }: { initialData: any[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingAcomodacao, setEditingAcomodacao] = useState<any>(null)

    const openAdd = () => {
        setEditingAcomodacao(null)
        setIsDialogOpen(true)
    }

    const openEdit = (acomodacao: any) => {
        setEditingAcomodacao(acomodacao)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        // Idealmente teriamos um Alert Dialog aqui confirmando a intenção
        const promise = deleteAcomodacao(id)
        toast.promise(promise, {
            loading: 'Deletando...',
            success: (result) => {
                if (result.error) throw new Error(result.error)
                return result.success
            },
            error: (e) => e.message || 'Erro ao deletar.'
        })
    }

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        // Simples toggle rápido para camareira: Livre <-> Limpeza
        const novoStatus = currentStatus === 'DISPONIVEL' ? 'LIMPEZA' : 'DISPONIVEL'
        const result = await toggleStatusAcomodacao(id, novoStatus)
        if (result.error) toast.error(result.error)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DISPONIVEL': return 'bg-green-500 hover:bg-green-600'
            case 'OCUPADO': return 'bg-blue-500 hover:bg-blue-600'
            case 'LIMPEZA': return 'bg-yellow-500 hover:bg-yellow-600'
            case 'MANUTENCAO': return 'bg-orange-500 hover:bg-orange-600'
            case 'BLOQUEADO': return 'bg-red-500 hover:bg-red-600'
            default: return 'bg-gray-500'
        }
    }

    return (
        <>
            <div className="flex justify-end">
                <Button onClick={openAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Nova Acomodação
                </Button>
            </div>

            {/* MOBILE: cards empilhados (sem scroll lateral) */}
            <div className="md:hidden space-y-2">
                {initialData.length === 0 ? (
                    <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground text-sm">
                        Nenhuma acomodação cadastrada. Comece adicionando seu primeiro quarto!
                    </div>
                ) : (
                    initialData.map((quarto) => (
                        <div key={quarto.id} className="rounded-lg border bg-card p-3 flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{quarto.nome}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{quarto.tipo} · {quarto.capacidade} pessoa{quarto.capacidade > 1 ? 's' : ''}</p>
                                {quarto.valorDiaria && (
                                    <p className="text-xs text-muted-foreground">
                                        R$ {Number(quarto.valorDiaria).toFixed(2).replace('.', ',')} / noite
                                    </p>
                                )}
                                <div className="mt-2">
                                    <Badge
                                        className={`cursor-pointer text-xs ${getStatusColor(quarto.status)}`}
                                        onClick={() => handleToggleStatus(quarto.id, quarto.status)}
                                        title="Toque para alternar status"
                                    >
                                        {quarto.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEdit(quarto)}
                                    title="Editar"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(quarto.id)}
                                    title="Excluir"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* DESKTOP: tabela completa */}
            <div className="hidden md:block rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Identificação</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Capacidade</TableHead>
                            <TableHead>Diária Base</TableHead>
                            <TableHead>Status Atual</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Nenhuma acomodação cadastrada. Comece adicionando seu primeiro quarto!
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialData.map((quarto) => (
                                <TableRow key={quarto.id}>
                                    <TableCell className="font-medium">{quarto.nome}</TableCell>
                                    <TableCell>{quarto.tipo}</TableCell>
                                    <TableCell>{quarto.capacidade} Pessoas</TableCell>
                                    <TableCell>
                                        {quarto.valorDiaria ? `R$ ${Number(quarto.valorDiaria).toFixed(2).replace('.', ',')}` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`cursor-pointer ${getStatusColor(quarto.status)}`}
                                            onClick={() => handleToggleStatus(quarto.id, quarto.status)}
                                            title="Clique duplo para ir a limpeza"
                                        >
                                            {quarto.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEdit(quarto)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Editar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(quarto.id)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingAcomodacao ? 'Editar Quarto' : 'Novo Quarto'}</DialogTitle>
                    </DialogHeader>
                    <AcomodacaoForm
                        initialData={editingAcomodacao}
                        onSuccess={() => setIsDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
