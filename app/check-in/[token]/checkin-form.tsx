'use client'

import { useState } from 'react'
import { salvarDadosCheckin } from '@/actions/checkin-virtual'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Hotel } from 'lucide-react'

const ESTADOS_BR = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

interface Reserva {
    id: string
    status: string
    dataCheckin: string
    dataCheckout: string
    acomodacao: { nome: string; tipo: string }
    pousada: { nome: string; logoUrl: string | null }
    hospede: {
        id: string
        nome: string
        cpf: string | null
        telefone: string | null
        email: string | null
        dataNascimento: string | null
        endereco: string | null
        cidade: string | null
        estado: string | null
    }
}

interface Props {
    token: string
    reserva: Reserva
}

export function CheckinForm({ token, reserva }: Props) {
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(false)
    const [estado, setEstado] = useState(reserva.hospede.estado || '')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const form = e.currentTarget
        const data = {
            nome: (form.elements.namedItem('nome') as HTMLInputElement).value,
            cpf: (form.elements.namedItem('cpf') as HTMLInputElement).value || undefined,
            telefone: (form.elements.namedItem('telefone') as HTMLInputElement).value || undefined,
            email: (form.elements.namedItem('email') as HTMLInputElement).value || undefined,
            dataNascimento: (form.elements.namedItem('dataNascimento') as HTMLInputElement).value || undefined,
            endereco: (form.elements.namedItem('endereco') as HTMLInputElement).value || undefined,
            cidade: (form.elements.namedItem('cidade') as HTMLInputElement).value || undefined,
            estado: estado || undefined,
        }

        const result = await salvarDadosCheckin(token, data)

        setLoading(false)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(result.success)
            setSaved(true)
        }
    }

    if (saved) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <CheckCircle2 className="h-14 w-14 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Tudo certo!</h1>
                    <p className="text-gray-600">
                        Seus dados foram salvos com sucesso. Até logo, <strong>{reserva.hospede.nome}</strong>!
                    </p>
                    <p className="text-sm text-gray-400">
                        Check-in em <strong>{format(new Date(reserva.dataCheckin), "dd 'de' MMMM", { locale: ptBR })}</strong> na {reserva.pousada.nome}.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/30 py-8 px-4">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header da pousada */}
                <div className="bg-white rounded-xl shadow-sm p-6 text-center space-y-2">
                    <div className="flex justify-center mb-2">
                        <Hotel className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">{reserva.pousada.nome}</h1>
                    <p className="text-sm text-muted-foreground">Check-in Virtual</p>
                </div>

                {/* Resumo da reserva */}
                <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                    <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Sua Reserva</h2>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs">Acomodação</p>
                            <p className="font-semibold">{reserva.acomodacao.nome}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Check-in</p>
                            <p className="font-semibold">{format(new Date(reserva.dataCheckin), "dd/MM/yyyy", { locale: ptBR })}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Check-out</p>
                            <p className="font-semibold">{format(new Date(reserva.dataCheckout), "dd/MM/yyyy", { locale: ptBR })}</p>
                        </div>
                    </div>
                </div>

                {/* Formulário */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="font-semibold text-gray-800 mb-1">Seus Dados Pessoais</h2>
                    <p className="text-sm text-muted-foreground mb-5">Preencha ou confirme seus dados para agilizar o check-in presencial.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="nome">Nome completo *</Label>
                            <Input
                                id="nome"
                                name="nome"
                                required
                                defaultValue={reserva.hospede.nome}
                                placeholder="Seu nome completo"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input
                                    id="cpf"
                                    name="cpf"
                                    defaultValue={reserva.hospede.cpf || ''}
                                    placeholder="000.000.000-00"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                                <Input
                                    id="telefone"
                                    name="telefone"
                                    defaultValue={reserva.hospede.telefone || ''}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={reserva.hospede.email || ''}
                                    placeholder="seu@email.com"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="dataNascimento">Data de nascimento</Label>
                                <Input
                                    id="dataNascimento"
                                    name="dataNascimento"
                                    type="date"
                                    defaultValue={reserva.hospede.dataNascimento
                                        ? reserva.hospede.dataNascimento.split('T')[0]
                                        : ''}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="endereco">Endereço</Label>
                            <Input
                                id="endereco"
                                name="endereco"
                                defaultValue={reserva.hospede.endereco || ''}
                                placeholder="Rua, número, complemento"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="cidade">Cidade</Label>
                                <Input
                                    id="cidade"
                                    name="cidade"
                                    defaultValue={reserva.hospede.cidade || ''}
                                    placeholder="Sua cidade"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Estado</Label>
                                <Select value={estado} onValueChange={setEstado}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="UF" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ESTADOS_BR.map(uf => (
                                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button type="submit" className="w-full mt-2" disabled={loading}>
                            {loading ? 'Salvando...' : 'Confirmar meus dados'}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-muted-foreground pb-4">
                    Seus dados são usados exclusivamente para fins de hospedagem.
                </p>
            </div>
        </div>
    )
}
