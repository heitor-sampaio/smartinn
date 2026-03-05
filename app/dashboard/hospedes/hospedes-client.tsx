'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HospedeForm } from './hospede-form'
import { deleteHospede } from '@/actions/hospedes'
import { toast } from 'sonner'

export function HospedesClient({ initialData }: { initialData: any[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingHospede, setEditingHospede] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const openAdd = () => {
        setEditingHospede(null)
        setIsDialogOpen(true)
    }

    const openEdit = (hospede: any) => {
        setEditingHospede(hospede)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        const promise = deleteHospede(id)
        toast.promise(promise, {
            loading: 'Removendo ficha...',
            success: (result) => {
                if (result.error) throw new Error(result.error)
                return result.success
            },
            error: (e) => e.message || 'Erro ao deletar hóspede.'
        })
    }

    // Filtro visual rápido (Client side)
    const filteredData = initialData.filter(hospede =>
        hospede.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (hospede.cpf && hospede.cpf.includes(searchTerm))
    )

    return (
        <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <p className="text-muted-foreground w-full sm:w-auto">
                    Mantenha a base de contatos dos seus clientes (CRM).
                </p>
                <div className="flex w-full sm:w-auto items-center space-x-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nome ou CPF..."
                            className="pl-8 bg-background"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={openAdd} className="shrink-0">
                        <Plus className="mr-2 h-4 w-4" /> Novo Hóspede
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead className="hidden md:table-cell">Contato</TableHead>
                            <TableHead className="hidden lg:table-cell">Documento</TableHead>
                            <TableHead className="hidden md:table-cell">Cidade</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    {searchTerm ? 'Nenhum hóspede encontrado na busca.' : 'Sua lista de hóspedes está vazia.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((hospede) => (
                                <TableRow key={hospede.id}>
                                    <TableCell className="font-medium">{hospede.nome}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="text-sm">{hospede.telefone || '-'}</div>
                                        <div className="text-xs text-muted-foreground">{hospede.email || ''}</div>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">{hospede.cpf || 'Não informado'}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {hospede.cidade ? `${hospede.cidade}/${hospede.estado || ''}` : 'Não informado'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit(hospede)}
                                                className="hidden sm:flex"
                                            >
                                                <Pencil className="mr-2 h-4 w-4" /> Ver Ficha
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit(hospede)}
                                                className="sm:hidden"
                                                title="Ver Ficha"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(hospede.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hidden sm:flex"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(hospede.id)}
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
                {/* Usando uma largura maior sm:max-w-2xl para acomodar melhor o formulário do Hospede que tem mais campos */}
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingHospede ? 'Ficha do Hóspede' : 'Novo Hóspede'}</DialogTitle>
                    </DialogHeader>
                    <HospedeForm
                        initialData={editingHospede}
                        onSuccess={() => setIsDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
