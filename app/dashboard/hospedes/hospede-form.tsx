'use client'

import { useState } from 'react'
import { createHospede, updateHospede } from '@/actions/hospedes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// ── Máscaras ────────────────────────────────────────────────────────────────

function maskCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 10) {
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
}

function maskCep(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    return digits.replace(/(\d{5})(\d)/, '$1-$2')
}

// ── Validação CPF ────────────────────────────────────────────────────────────

function validateCpf(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, '')
    if (digits.length !== 11) return false
    if (/^(\d)\1{10}$/.test(digits)) return false

    let sum = 0
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
    let rem = (sum * 10) % 11
    if (rem === 10 || rem === 11) rem = 0
    if (rem !== parseInt(digits[9])) return false

    sum = 0
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
    rem = (sum * 10) % 11
    if (rem === 10 || rem === 11) rem = 0
    return rem === parseInt(digits[10])
}

export function HospedeForm({
    initialData,
    onSuccess
}: {
    initialData?: any,
    onSuccess: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [cpfValue, setCpfValue] = useState(initialData?.cpf ?? '')
    const [cpfError, setCpfError] = useState('')
    const [phoneValue, setPhoneValue] = useState(initialData?.telefone ?? '')
    const [cepValue, setCepValue] = useState(initialData?.cep ?? '')
    const [cepLoading, setCepLoading] = useState(false)
    const [endereco, setEndereco] = useState(initialData?.endereco ?? '')
    const [cidade, setCidade] = useState(initialData?.cidade ?? '')
    const [estado, setEstado] = useState(initialData?.estado ?? '')

    const defaultDateStr = initialData?.dataNascimento
        ? new Date(initialData.dataNascimento).toISOString().split('T')[0]
        : ''

    // ── CEP lookup ────────────────────────────────────────────────────────────

    async function handleCepBlur() {
        const digits = cepValue.replace(/\D/g, '')
        if (digits.length !== 8) return
        setCepLoading(true)
        try {
            const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
            const data = await res.json()
            if (data.erro) {
                toast.error('CEP não encontrado.')
            } else {
                setEndereco(data.logradouro ?? '')
                setCidade(data.localidade ?? '')
                setEstado(data.uf ?? '')
            }
        } catch {
            toast.error('Falha ao buscar o CEP.')
        } finally {
            setCepLoading(false)
        }
    }

    // ── Submit ─────────────────────────────────────────────────────────────────

    async function onSubmit(formData: FormData) {
        // Valida CPF se preenchido
        const rawCpf = cpfValue.replace(/\D/g, '')
        if (rawCpf.length > 0 && !validateCpf(cpfValue)) {
            setCpfError('CPF inválido.')
            return
        }
        setCpfError('')

        // Injeta valores controlados no FormData
        formData.set('cpf', cpfValue)
        formData.set('telefone', phoneValue)
        formData.set('cep', cepValue)
        formData.set('endereco', endereco)
        formData.set('cidade', cidade)
        formData.set('estado', estado)

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
                                <Label htmlFor="cpf">CPF</Label>
                                <Input
                                    id="cpf"
                                    name="cpf"
                                    placeholder="000.000.000-00"
                                    value={cpfValue}
                                    onChange={e => {
                                        setCpfValue(maskCpf(e.target.value))
                                        if (cpfError) setCpfError('')
                                    }}
                                    onBlur={() => {
                                        const raw = cpfValue.replace(/\D/g, '')
                                        if (raw.length > 0 && !validateCpf(cpfValue)) {
                                            setCpfError('CPF inválido.')
                                        } else {
                                            setCpfError('')
                                        }
                                    }}
                                    inputMode="numeric"
                                    maxLength={14}
                                    className={cpfError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                />
                                {cpfError && <p className="text-xs text-red-500">{cpfError}</p>}
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
                                    placeholder="(00) 00000-0000"
                                    value={phoneValue}
                                    onChange={e => setPhoneValue(maskPhone(e.target.value))}
                                    inputMode="numeric"
                                    maxLength={15}
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

                    {/* Seção 3: Endereço */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 border-b pb-1">Localização & Observações</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                            {/* CEP — primeiro campo, linha própria */}
                            <div className="space-y-2">
                                <Label htmlFor="cep">CEP</Label>
                                <div className="relative">
                                    <Input
                                        id="cep"
                                        name="cep"
                                        placeholder="00000-000"
                                        value={cepValue}
                                        onChange={e => setCepValue(maskCep(e.target.value))}
                                        onBlur={handleCepBlur}
                                        inputMode="numeric"
                                        maxLength={9}
                                    />
                                    {cepLoading && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="endereco">Logradouro</Label>
                                <Input
                                    id="endereco"
                                    name="endereco"
                                    placeholder="Rua das Árvores, 123"
                                    value={endereco}
                                    onChange={e => setEndereco(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cidade">Cidade</Label>
                                <Input
                                    id="cidade"
                                    name="cidade"
                                    value={cidade}
                                    onChange={e => setCidade(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="estado">Estado (UF)</Label>
                                <Input
                                    id="estado"
                                    name="estado"
                                    placeholder="Ex: SP"
                                    value={estado}
                                    onChange={e => setEstado(e.target.value.toUpperCase().slice(0, 2))}
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
