'use client'

import { useState } from 'react'
import { createHospede, updateHospede } from '@/actions/hospedes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export function HospedeForm({
    initialData,
    onSuccess
}: {
    initialData?: any,
    onSuccess: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)

    // Tratamento da data para o formato YYYY-MM-DD aceito nativamente no input type="date"
    const defaultDateStr = initialData?.dataNascimento
        ? new Date(initialData.dataNascimento).toISOString().split('T')[0]
        : ''

    async function onSubmit(formData: FormData) {
        setIsLoading(true)

        let result;
        if (initialData?.id) {
            result = await updateHospede(initialData.id, formData)
        } else {
            result = await createHospede(formData)
        }

        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            toast.success(result.success)
            onSuccess()
        }
    }

    return (
        <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="historico" disabled={!initialData?.id}>Histórico de Reservas</TabsTrigger>
            </TabsList>

            <TabsContent value="dados">
                <form action={onSubmit} className="space-y-6 py-2">
                    {/* Seção 1: Identificação */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 border-b pb-1">Identificação</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome Completo <span className="text-red-500">*</span></Label>
                                <Input
                                    id="nome"
                                    name="nome"
                                    placeholder="Ex: José Ferreira Bento"
                                    defaultValue={initialData?.nome}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cpf">Documento (CPF/Passaporte)</Label>
                                <Input
                                    id="cpf"
                                    name="cpf"
                                    placeholder="000.000.000-00"
                                    defaultValue={initialData?.cpf}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                                <Input
                                    id="dataNascimento"
                                    name="dataNascimento"
                                    type="date"
                                    defaultValue={defaultDateStr}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seção 2: Contato */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 border-b pb-1">Contato</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
                                <Input
                                    id="telefone"
                                    name="telefone"
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    defaultValue={initialData?.telefone}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail Principal</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="jose@email.com"
                                    defaultValue={initialData?.email}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seção 3: Endereço & Extras */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 border-b pb-1">Localização & Oberservações</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="endereco">Logradouro Completo</Label>
                                <Input
                                    id="endereco"
                                    name="endereco"
                                    placeholder="Rua das Árvores, 123"
                                    defaultValue={initialData?.endereco}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cidade">Cidade</Label>
                                <Input
                                    id="cidade"
                                    name="cidade"
                                    defaultValue={initialData?.cidade}
                                />
                            </div>

                            <div className="scope-y-2">
                                <Label htmlFor="estado">Estado (UF)</Label>
                                <Input
                                    id="estado"
                                    name="estado"
                                    placeholder="Ex: SP, RJ, BA"
                                    defaultValue={initialData?.estado}
                                    maxLength={2}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="observacoes">Observações (Preferências, Alergias, etc)</Label>
                            <Input
                                id="observacoes"
                                name="observacoes"
                                placeholder="Ex: Alérgico a penas, prefere quarto no térreo..."
                                defaultValue={initialData?.observacoes}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-2 border-t mt-6">
                        <Button variant="outline" type="button" onClick={onSuccess}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Salvando...' : 'Salvar Hóspede'}
                        </Button>
                    </div>
                </form>
            </TabsContent>

            <TabsContent value="historico">
                <div className="space-y-4 py-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Últimas Estadias</h3>
                    {(!initialData?.reservas || initialData.reservas.length === 0) ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted/40 rounded-md border border-dashed">
                            Este hóspede ainda não possui histórico de reservas.
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                            {initialData.reservas.map((res: any) => (
                                <div key={res.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg bg-card shadow-sm gap-2">
                                    <div>
                                        <div className="font-semibold text-sm">
                                            {res.acomodacao.nome} <span className="text-muted-foreground font-normal ml-2">({res.totalHospedes} pax)</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {new Date(res.dataCheckin).toLocaleDateString('pt-BR')} até {new Date(res.dataCheckout).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                    <div className="flex sm:flex-col items-center sm:items-end w-full sm:w-auto justify-between sm:justify-center gap-2">
                                        <div className="font-semibold text-sm">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(res.valorTotal)}
                                        </div>
                                        <div>
                                            {res.status === 'CONFIRMADA' && <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded font-medium">CONFIRMADA</span>}
                                            {res.status === 'PENDENTE' && <span className="bg-gray-100 text-gray-800 text-[10px] px-2 py-1 rounded font-medium">ORÇAMENTO</span>}
                                            {res.status === 'CHECKIN_FEITO' && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-1 rounded font-medium">EM ANDAMENTO</span>}
                                            {res.status === 'CHECKOUT_FEITO' && <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded font-medium">CONCLUÍDA</span>}
                                            {res.status === 'CANCELADA' && <span className="bg-red-100 text-red-800 text-[10px] px-2 py-1 rounded font-medium">CANCELADA</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    )
}
