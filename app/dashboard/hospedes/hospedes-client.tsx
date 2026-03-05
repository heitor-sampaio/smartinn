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

            {/* MOBILE: lista de cards (sem scroll lateral) */}
            <div className="md:hidden space-y-2">
                {filteredData.length === 0 ? (
                    <div className="rounded-md border bg-card p-8 text-center text-muted-foreground text-sm">
                        {searchTerm ? 'Nenhum hóspede encontrado na busca.' : 'Sua lista de hóspedes está vazia.'}
                    </div>
                ) : (
                    filteredData.map((hospede) => (
                        <div
                            key={hospede.id}
                            className="rounded-lg border bg-card p-4 flex items-start justify-between gap-3"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{hospede.nome}</p>
                                {hospede.telefone && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{hospede.telefone}</p>
                                )}
                                {hospede.email && (
                                    <p className="text-xs text-muted-foreground truncate">{hospede.email}</p>
                                )}
                                {hospede.cidade && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {hospede.cidade}{hospede.estado ? `/${hospede.estado}` : ''}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEdit(hospede)}
                                    title="Ver Ficha"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(hospede.id)}
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
            <div className="hidden md:block rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead className="hidden lg:table-cell">Documento</TableHead>
                            <TableHead>Cidade</TableHead>
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
                                    <TableCell>
                                        <div className="text-sm">{hospede.telefone || '-'}</div>
                                        <div className="text-xs text-muted-foreground">{hospede.email || ''}</div>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">{hospede.cpf || 'Não informado'}</TableCell>
                                    <TableCell>
                                        {hospede.cidade ? `${hospede.cidade}/${hospede.estado || ''}` : 'Não informado'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEdit(hospede)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Ver Ficha
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(hospede.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
