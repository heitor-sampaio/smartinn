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
            <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground">
                    Gerencie os quartos, chalés e camas da sua propriedade.
                </p>
                <Button onClick={openAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Quarto
                </Button>
            </div>

            <div className="rounded-md border">
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
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit(quarto)}
                                                className="hidden sm:flex"
                                            >
                                                <Pencil className="mr-2 h-4 w-4" /> Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit(quarto)}
                                                className="sm:hidden"
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(quarto.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hidden sm:flex"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(quarto.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 sm:hidden"
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-4 w-4" />
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
