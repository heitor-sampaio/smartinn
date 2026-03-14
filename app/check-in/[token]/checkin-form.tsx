'use client'

import { useState } from 'react'
import { salvarDadosCheckin } from '@/actions/checkin-virtual'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { CheckCircle2, Hotel, FileText, Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ── Máscaras ─────────────────────────────────────────────────────────────────

function maskCpf(value: string): string {
    const d = value.replace(/\D/g, '').slice(0, 11)
    return d
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

function maskPhone(value: string): string {
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

function maskCep(value: string): string {
    const d = value.replace(/\D/g, '').slice(0, 8)
    return d.replace(/(\d{5})(\d)/, '$1-$2')
}

// ── Validação CPF ─────────────────────────────────────────────────────────────

function validateCpf(cpf: string): boolean {
    const d = cpf.replace(/\D/g, '')
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
    let s = 0
    for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i)
    let r = (s * 10) % 11
    if (r === 10 || r === 11) r = 0
    if (r !== parseInt(d[9])) return false
    s = 0
    for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i)
    r = (s * 10) % 11
    if (r === 10 || r === 11) r = 0
    return r === parseInt(d[10])
}

// ─────────────────────────────────────────────────────────────────────────────

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
        cep: string | null
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
    const h = reserva.hospede

    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(false)

    const [cpfValue, setCpfValue] = useState(h.cpf ?? '')
    const [cpfError, setCpfError] = useState('')
    const [phoneValue, setPhoneValue] = useState(h.telefone ?? '')
    const [cepValue, setCepValue] = useState(h.cep ?? '')
    const [cepLoading, setCepLoading] = useState(false)
    const [endereco, setEndereco] = useState(h.endereco ?? '')
    const [cidade, setCidade] = useState(h.cidade ?? '')
    const [estado, setEstado] = useState(h.estado ?? '')
    const [nacionalidade, setNacionalidade] = useState('BR')
    const [genero, setGenero] = useState('')
    const [motivoEstadia, setMotivoEstadia] = useState('')
    const [tipoDocumento, setTipoDocumento] = useState('')
    const [numeroDocumento, setNumeroDocumento] = useState('')

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const rawCpf = cpfValue.replace(/\D/g, '')
        if (rawCpf.length > 0 && !validateCpf(cpfValue)) {
            setCpfError('CPF inválido.')
            return
        }
        setCpfError('')
        setLoading(true)

        const form = e.currentTarget
        const result = await salvarDadosCheckin(token, {
            nome: (form.elements.namedItem('nome') as HTMLInputElement).value,
            cpf: cpfValue || undefined,
            telefone: phoneValue || undefined,
            email: (form.elements.namedItem('email') as HTMLInputElement).value || undefined,
            dataNascimento: (form.elements.namedItem('dataNascimento') as HTMLInputElement).value || undefined,
            cep: cepValue || undefined,
            endereco: endereco || undefined,
            cidade: cidade || undefined,
            estado: estado || undefined,
            nacionalidade: nacionalidade || undefined,
            genero: genero || undefined,
            motivoEstadia: motivoEstadia || undefined,
            tipoDocumento: (nacionalidade !== 'BR' && tipoDocumento) ? tipoDocumento : undefined,
            numeroDocumento: (nacionalidade !== 'BR' && numeroDocumento) ? numeroDocumento : undefined,
        })

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
                        Seus dados foram salvos com sucesso. Até logo, <strong>{h.nome}</strong>!
                    </p>
                    <p className="text-sm text-gray-400">
                        Check-in em <strong>{format(new Date(reserva.dataCheckin), "dd 'de' MMMM", { locale: ptBR })}</strong> na {reserva.pousada.nome}.
                    </p>
                    <Button asChild className="w-full mt-2">
                        <Link href={`/check-in/${token}/ficha`}>
                            <FileText className="h-4 w-4 mr-2" />
                            Ver minha ficha de reserva
                        </Link>
                    </Button>
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
                        {reserva.pousada.logoUrl ? (
                            <img src={reserva.pousada.logoUrl} alt={reserva.pousada.nome} className="h-10 w-auto object-contain" />
                        ) : (
                            <Hotel className="h-8 w-8 text-primary" />
                        )}
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

                        {/* Nome */}
                        <div className="space-y-1.5">
                            <Label htmlFor="nome">Nome completo *</Label>
                            <Input
                                id="nome"
                                name="nome"
                                required
                                defaultValue={h.nome}
                                placeholder="Seu nome completo"
                            />
                        </div>

                        {/* CPF + Telefone */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
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
                                        if (raw.length > 0 && !validateCpf(cpfValue)) setCpfError('CPF inválido.')
                                        else setCpfError('')
                                    }}
                                    inputMode="numeric"
                                    maxLength={14}
                                    className={cpfError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                />
                                {cpfError && <p className="text-xs text-red-500">{cpfError}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
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
                        </div>

                        {/* Email + Data de nascimento */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={h.email || ''}
                                    placeholder="seu@email.com"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="dataNascimento">Data de nascimento</Label>
                                <Input
                                    id="dataNascimento"
                                    name="dataNascimento"
                                    type="date"
                                    defaultValue={h.dataNascimento ? h.dataNascimento.split('T')[0] : ''}
                                />
                            </div>
                        </div>

                        {/* CEP */}
                        <div className="space-y-1.5">
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

                        {/* Logradouro */}
                        <div className="space-y-1.5">
                            <Label htmlFor="endereco">Endereço</Label>
                            <Input
                                id="endereco"
                                name="endereco"
                                placeholder="Rua, número, complemento"
                                value={endereco}
                                onChange={e => setEndereco(e.target.value)}
                            />
                        </div>

                        {/* Cidade + Estado */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="cidade">Cidade</Label>
                                <Input
                                    id="cidade"
                                    name="cidade"
                                    placeholder="Sua cidade"
                                    value={cidade}
                                    onChange={e => setCidade(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
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

                        {/* Divisor FNRH */}
                        <div className="pt-2 pb-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t pt-3">
                                Informações adicionais (obrigatório por lei)
                            </p>
                        </div>

                        {/* Nacionalidade */}
                        <div className="space-y-1.5">
                            <Label htmlFor="nacionalidade">Nacionalidade</Label>
                            <Select value={nacionalidade} onValueChange={setNacionalidade}>
                                <SelectTrigger id="nacionalidade">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BR">Brasileira</SelectItem>
                                    <SelectItem value="AR">Argentina</SelectItem>
                                    <SelectItem value="US">Americana (EUA)</SelectItem>
                                    <SelectItem value="PT">Portuguesa</SelectItem>
                                    <SelectItem value="DE">Alemã</SelectItem>
                                    <SelectItem value="FR">Francesa</SelectItem>
                                    <SelectItem value="IT">Italiana</SelectItem>
                                    <SelectItem value="ES">Espanhola</SelectItem>
                                    <SelectItem value="GB">Britânica</SelectItem>
                                    <SelectItem value="UY">Uruguaia</SelectItem>
                                    <SelectItem value="CL">Chilena</SelectItem>
                                    <SelectItem value="CO">Colombiana</SelectItem>
                                    <SelectItem value="PE">Peruana</SelectItem>
                                    <SelectItem value="CN">Chinesa</SelectItem>
                                    <SelectItem value="JP">Japonesa</SelectItem>
                                    <SelectItem value="OUTRO">Outra</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Gênero + Motivo da Estadia */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="genero">Gênero</Label>
                                <Select value={genero} onValueChange={setGenero}>
                                    <SelectTrigger id="genero">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MASCULINO">Masculino</SelectItem>
                                        <SelectItem value="FEMININO">Feminino</SelectItem>
                                        <SelectItem value="NAO_INFORMADO">Prefiro não informar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="motivoEstadia">Motivo da estadia</Label>
                                <Select value={motivoEstadia} onValueChange={setMotivoEstadia}>
                                    <SelectTrigger id="motivoEstadia">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LAZER">Lazer / Turismo</SelectItem>
                                        <SelectItem value="NEGOCIOS">Negócios</SelectItem>
                                        <SelectItem value="SAUDE">Saúde</SelectItem>
                                        <SelectItem value="EVENTOS">Eventos</SelectItem>
                                        <SelectItem value="OUTROS">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tipo + Número do documento — só para estrangeiros */}
                        {nacionalidade !== 'BR' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="tipoDocumento">Tipo de documento</Label>
                                    <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                                        <SelectTrigger id="tipoDocumento">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PASSAPORTE">Passaporte</SelectItem>
                                            <SelectItem value="RNE">RNE</SelectItem>
                                            <SelectItem value="RG">RG</SelectItem>
                                            <SelectItem value="CNH">CNH</SelectItem>
                                            <SelectItem value="CPF">CPF</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="numeroDocumento">Número do documento</Label>
                                    <Input
                                        id="numeroDocumento"
                                        name="numeroDocumento"
                                        placeholder="Nº do documento"
                                        value={numeroDocumento}
                                        onChange={e => setNumeroDocumento(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

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
