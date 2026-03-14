'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateAjustes } from '@/actions/configuracoes';
import { criarUsuario, desativarUsuario, ativarUsuario, excluirUsuario } from '@/actions/usuarios';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Building2, Save, Store, Palette, Loader2, MapPin, HardHat, CopyCheck, FileText, CreditCard, UserPlus, Trash2, Users2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Validation Schema
const configSchema = z.object({
    horaCheckin: z.string().min(5, "Formato HH:MM"),
    horaCheckout: z.string().min(5, "Formato HH:MM"),
    taxaCartao: z.number().min(0).max(100),
    taxaImpostos: z.number().min(0).max(100),
    taxaBooking: z.number().min(0).max(100),
    taxaAirbnb: z.number().min(0).max(100),
    taxaDecolar: z.number().min(0).max(100),
    taxaExpedia: z.number().min(0).max(100),

    nome: z.string().min(2, "Nome curto demais"),
    telefone: z.string().optional(),
    email: z.string().email("E-mail inválido"),
    cnpj: z.string().optional(),
    inscricaoEstadual: z.string().optional(),

    cep: z.string().optional(),
    endereco: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),

    ramalRecepcao: z.string().optional(),
    nomeWifi: z.string().optional(),
    senhaWifi: z.string().optional(),
    modoTema: z.string().optional(),
    tarifasDinamicasAtivas: z.boolean(),
    tarifaFimDeSemana: z.number().min(0),
    tarifaFeriado: z.number().min(0),
    tarifaTemporada: z.number().min(0),
    inicioTemporada: z.string().optional(),
    fimTemporada: z.string().optional(),
    fnrhUser: z.string().optional(),
    fnrhKey: z.string().optional(),
    fnrhAtivo: z.boolean(),
});

type ConfigFormValues = z.infer<typeof configSchema>;

type UsuarioItem = {
    id: string
    nome: string
    email: string
    perfil: string
    ativo: boolean
}

interface ConfiguracoesClientProps {
    initialData: any; // Using any here for brevity instead of full Prisma Type
    initialUsuarios: UsuarioItem[]
}

export default function ConfiguracoesClient({ initialData, initialUsuarios }: ConfiguracoesClientProps) {
    const [isPending, startTransition] = useTransition();
    const { setTheme, theme } = useTheme();
    const router = useRouter();

    // FNRH state
    const [showFnrhKey, setShowFnrhKey] = useState(false)

    // User management state
    const [usuarios, setUsuarios] = useState<UsuarioItem[]>(initialUsuarios)
    const [addMemberOpen, setAddMemberOpen] = useState(false)
    const [addingMember, setAddingMember] = useState(false)
    const [novoMembro, setNovoMembro] = useState({ nome: '', email: '', senha: '', perfil: 'RECEPCIONISTA' as 'RECEPCIONISTA' | 'EQUIPE' })

    useEffect(() => {
        setUsuarios(initialUsuarios)
    }, [initialUsuarios])

    const handleToggleAtivo = async (id: string, ativo: boolean) => {
        const action = ativo ? ativarUsuario : desativarUsuario
        const res = await action(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ativo } : u))
            toast.success(ativo ? 'Usuário ativado!' : 'Usuário desativado!')
        }
    }

    const handleExcluir = async (id: string) => {
        const res = await excluirUsuario(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            setUsuarios(prev => prev.filter(u => u.id !== id))
            toast.success('Membro removido com sucesso.')
        }
    }

    const handleCriarMembro = async () => {
        if (!novoMembro.nome || !novoMembro.email || !novoMembro.senha) {
            toast.error('Preencha todos os campos.')
            return
        }
        setAddingMember(true)
        const res = await criarUsuario(novoMembro)
        setAddingMember(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Membro criado com sucesso!')
            setAddMemberOpen(false)
            setNovoMembro({ nome: '', email: '', senha: '', perfil: 'RECEPCIONISTA' })
            router.refresh()
        }
    }

    const form = useForm<ConfigFormValues>({
        resolver: zodResolver(configSchema),
        defaultValues: {
            nome: initialData?.nome || '',
            email: initialData?.email || '',
            telefone: initialData?.telefone || '',
            cnpj: initialData?.cnpj || '',
            inscricaoEstadual: initialData?.inscricaoEstadual || '',
            horaCheckin: initialData?.horaCheckin || '14:00',
            horaCheckout: initialData?.horaCheckout || '12:00',
            taxaCartao: Number(initialData?.taxaCartao) || 0,
            taxaImpostos: Number(initialData?.taxaImpostos) || 0,
            taxaBooking: Number(initialData?.taxaBooking) || 0,
            taxaAirbnb: Number(initialData?.taxaAirbnb) || 0,
            taxaDecolar: Number(initialData?.taxaDecolar) || 0,
            taxaExpedia: Number(initialData?.taxaExpedia) || 0,
            cep: initialData?.cep || '',
            endereco: initialData?.endereco || '',
            cidade: initialData?.cidade || '',
            estado: initialData?.estado || '',
            ramalRecepcao: initialData?.ramalRecepcao || '',
            nomeWifi: initialData?.nomeWifi || '',
            senhaWifi: initialData?.senhaWifi || '',
            modoTema: initialData?.modoTema || 'system',
            tarifasDinamicasAtivas: Boolean(initialData?.tarifasDinamicasAtivas),
            tarifaFimDeSemana: Number(initialData?.tarifaFimDeSemana) || 0,
            tarifaFeriado: Number(initialData?.tarifaFeriado) || 0,
            tarifaTemporada: Number(initialData?.tarifaTemporada) || 0,
            inicioTemporada: initialData?.inicioTemporada ? new Date(initialData.inicioTemporada).toISOString().split('T')[0] : '',
            fimTemporada: initialData?.fimTemporada ? new Date(initialData.fimTemporada).toISOString().split('T')[0] : '',
            fnrhUser: initialData?.fnrhUser || '',
            fnrhKey: initialData?.fnrhKey || '',
            fnrhAtivo: Boolean(initialData?.fnrhAtivo),
        },
    });

    const onSubmit = (data: ConfigFormValues) => {
        startTransition(async () => {
            const dataToSend: any = { ...data };
            if (!dataToSend.inicioTemporada) dataToSend.inicioTemporada = null;
            if (!dataToSend.fimTemporada) dataToSend.fimTemporada = null;
            const res = await updateAjustes(dataToSend);
            if (res.success) {
                toast.success("Configurações salvas e aplicadas!");
                router.refresh(); // Força o refresh para puxar os dados mais novos (incluindo o tema no F5)
            } else {
                toast.error(res.error || "Ocorreu um erro ao salvar (Backend).");
            }
        });
    };

    // Para debugar erros de validação Zod no Client Side
    const onError = (errors: any) => {
        toast.error("Preencha corretamente os campos obrigatórios na aba Negócio!");
        console.error("Zod Validation Errors:", errors);
    };

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, "");
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    form.setValue('endereco', `${data.logradouro}, Bairro ${data.bairro}`);
                    form.setValue('cidade', data.localidade);
                    form.setValue('estado', data.uf);
                    toast.success("Endereço auto-completado!");
                }
            } catch (error) {
                toast.error("Erro ao buscar CEP");
            }
        }
    };

    // Funcoes de máscara (Regex simples)
    const maskCnpj = (v: string) => {
        v = v.replace(/\D/g, "");
        v = v.replace(/^(\d{2})(\d)/, "$1.$2");
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
        v = v.replace(/(\d{4})(\d)/, "$1-$2");
        return v.slice(0, 18);
    };

    const maskPhone = (v: string) => {
        v = v.replace(/\D/g, "");
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d)(\d{4})$/, "$1-$2");
        return v.slice(0, 15);
    };

    const maskCep = (v: string) => {
        v = v.replace(/\D/g, "");
        v = v.replace(/^(\d{5})(\d)/, "$1-$2");
        return v.slice(0, 9);
    }

    const maskHora = (v: string) => {
        v = v.replace(/\D/g, "");
        v = v.replace(/^(\d{2})(\d)/, "$1:$2");
        return v.slice(0, 5);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                <Tabs defaultValue="negocio" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 max-w-4xl mb-4 bg-muted/50 p-1 h-auto min-h-[40px]">
                        <TabsTrigger value="negocio" className="flex items-center gap-2 py-2">
                            <Store className="w-4 h-4 hidden sm:block" /> Negócio
                        </TabsTrigger>
                        <TabsTrigger value="dados" className="flex items-center gap-2 py-2">
                            <Building2 className="w-4 h-4 hidden sm:block" /> Cadastral
                        </TabsTrigger>
                        <TabsTrigger value="aparencia" className="flex items-center gap-2 py-2">
                            <Palette className="w-4 h-4 hidden sm:block" /> Aparência
                        </TabsTrigger>
                        <TabsTrigger value="equipe" className="flex items-center gap-2 py-2">
                            <HardHat className="w-4 h-4 hidden sm:block" /> Equipe
                        </TabsTrigger>
                        <TabsTrigger value="fiscal" className="flex items-center gap-2 py-2">
                            <FileText className="w-4 h-4 hidden sm:block" /> Fiscal
                        </TabsTrigger>
                        <TabsTrigger value="assinatura" className="flex items-center gap-2 py-2">
                            <CreditCard className="w-4 h-4 hidden sm:block" /> Assinatura
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: Configurações do Negócio */}
                    <TabsContent value="negocio" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Rotina Hoteleira</CardTitle>
                                <CardDescription>
                                    Defina os horários base para controle de disponibilidade e faturamento ("hand-over").
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="horaCheckin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Horário Padrão de Check-in</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="14:00"
                                                    {...field}
                                                    onChange={(e) => field.onChange(maskHora(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormDescription>A partir de que horas o hóspede pode entrar.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="horaCheckout"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Horário Padrão de Check-out</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="12:00"
                                                    {...field}
                                                    onChange={(e) => field.onChange(maskHora(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormDescription>Horário limite para esvaziar o quarto.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="taxaCartao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Taxa Cartão de Crédito (%)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                            <FormDescription>Usado em relatórios líquidos de faturamento.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="ramalRecepcao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ramal da Recepção</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: 100" {...field} />
                                            </FormControl>
                                            <FormDescription>Número interno para o hóspede ligar.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="nomeWifi"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome da Rede Wi-Fi</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Pousada_Guest" {...field} />
                                            </FormControl>
                                            <FormDescription>SSID exibido na ficha do hóspede.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="senhaWifi"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Senha do Wi-Fi</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: bemvindo2024" {...field} />
                                            </FormControl>
                                            <FormDescription>Exibida na ficha do hóspede após check-in.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Comissões de OTAs e Motores de Reserva</CardTitle>
                                <CardDescription>
                                    Percentual de comissão cobrado por cada canal de distribuição. Usados nos cálculos de receita líquida nos indicadores.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                {[
                                    { name: 'taxaBooking' as const, label: 'Booking.com' },
                                    { name: 'taxaAirbnb' as const, label: 'Airbnb' },
                                    { name: 'taxaDecolar' as const, label: 'Decolar' },
                                    { name: 'taxaExpedia' as const, label: 'Expedia' },
                                ].map(({ name, label }) => (
                                    <FormField
                                        key={name}
                                        control={form.control}
                                        name={name}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{label} (%)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="100"
                                                        placeholder="0.00"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle>Tarifas Dinâmicas</CardTitle>
                                    <CardDescription>
                                        Configure acréscimos automáticos no valor da diária base para períodos específicos.
                                    </CardDescription>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="tarifasDinamicasAtivas"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col items-center justify-center pt-2">
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardHeader>
                            {form.watch("tarifasDinamicasAtivas") && (
                                <CardContent className="space-y-4 pt-4 border-t">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <FormField
                                            control={form.control}
                                            name="tarifaFimDeSemana"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Finais de Semana (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="1" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                                    </FormControl>
                                                    <FormDescription>Sex, Sáb e Dom.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="tarifaFeriado"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Feriados (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="1" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                                    </FormControl>
                                                    <FormDescription>Acréscimo automático.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="tarifaTemporada"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Temporada (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="1" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                                    </FormControl>
                                                    <FormDescription>Acréscimo na alta temporada.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="inicioTemporada"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Início da Temporada</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} value={field.value || ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="fimTemporada"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Final da Temporada</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} value={field.value || ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* FNRH Section */}
                        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                                        <CardTitle className="text-base">Integração FNRH Digital (MTUR)</CardTitle>
                                        {form.watch('fnrhAtivo') ? (
                                            form.watch('fnrhUser') && form.watch('fnrhKey') ? (
                                                <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">Configurado</Badge>
                                            ) : (
                                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">Não configurado</Badge>
                                            )
                                        ) : (
                                            <Badge variant="secondary" className="text-xs">Desabilitada</Badge>
                                        )}
                                    </div>
                                    <CardDescription>
                                        Obrigatório por lei (Portaria MTUR Nº 41/2025) a partir de 13/04/2026.
                                        As credenciais são geradas no{' '}
                                        <a href="https://cadastur.turismo.gov.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline underline-offset-2">
                                            Cadastur
                                        </a>.
                                    </CardDescription>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="fnrhAtivo"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col items-center justify-center pt-2">
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardHeader>
                            {form.watch('fnrhAtivo') && (
                                <CardContent className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                                    <FormField
                                        control={form.control}
                                        name="fnrhUser"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>FNRH User</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Usuário fornecido pelo Cadastur" autoComplete="off" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="fnrhKey"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>FNRH Key</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            {...field}
                                                            type={showFnrhKey ? 'text' : 'password'}
                                                            placeholder="Chave secreta do Cadastur"
                                                            autoComplete="off"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                                            onClick={() => setShowFnrhKey(v => !v)}
                                                            tabIndex={-1}
                                                        >
                                                            {showFnrhKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            )}
                        </Card>
                    </TabsContent>

                    {/* TAB 2: Dados Cadastrais */}
                    <TabsContent value="dados" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Identificação da Pousada</CardTitle>
                                <CardDescription>
                                    Informações públicas que sairão em orçamentos, recibos e extratos do hóspede.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="nome"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome Fantasia</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Pousada Sol Nascente" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="cnpj"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CNPJ</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="00.000.000/0000-00"
                                                    onChange={(e) => field.onChange(maskCnpj(e.target.value))}
                                                    maxLength={18}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="inscricaoEstadual"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Inscrição Estadual (IE)</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Opcional" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>E-mail de Contato</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="contato@pousada.com.br" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="telefone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefone / WhatsApp</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="(11) 99999-9999"
                                                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                                                    maxLength={15}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Endereco com ViaCEP */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Localização</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="cep"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CEP</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="00000-000"
                                                    onChange={(e) => field.onChange(maskCep(e.target.value))}
                                                    onBlur={(e) => {
                                                        field.onBlur();
                                                        handleCepBlur(e);
                                                    }}
                                                    maxLength={9}
                                                />
                                            </FormControl>
                                            <FormDescription>Busca automática de logradouro</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="endereco"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Endereço e Bairro</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Rua das Flores, 123" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="cidade"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cidade</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="estado"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado (UF)</FormLabel>
                                            <FormControl>
                                                <Input {...field} maxLength={2} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: Aparência (Geral da Aplicação) */}
                    <TabsContent value="aparencia" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personalização de Ambiente</CardTitle>
                                <CardDescription>
                                    Ajustes visuais que impactam no seu conforto diário com o sistema.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                {/* Theme Selector (Synced with DB) */}
                                <FormField
                                    control={form.control}
                                    name="modoTema"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col gap-3">
                                            <FormLabel className="text-sm font-medium">Esquema de Cores (Dia e Noite)</FormLabel>
                                            <FormControl>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        type="button"
                                                        onClick={() => {
                                                            setTheme('light');
                                                            field.onChange('light');
                                                        }}
                                                        variant={field.value === 'light' ? 'default' : 'outline'}
                                                    >
                                                        ☀️ Modo Claro
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={() => {
                                                            setTheme('dark');
                                                            field.onChange('dark');
                                                        }}
                                                        variant={field.value === 'dark' ? 'default' : 'outline'}
                                                    >
                                                        🌙 Modo Escuro
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={() => {
                                                            setTheme('system');
                                                            field.onChange('system');
                                                        }}
                                                        variant={field.value === 'system' ? 'default' : 'outline'}
                                                    >
                                                        💻 Automático (Sistema)
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormDescription>Esta configuração define como o sistema será exibido para você e sua equipe.</FormDescription>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 4: Gerenciamento de Membros */}
                    <TabsContent value="equipe" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div>
                                        <CardTitle>Membros da Equipe</CardTitle>
                                        <CardDescription className="mt-1">
                                            Cada colaborador tem login individual. O acesso é restrito ao perfil atribuído.
                                        </CardDescription>
                                    </div>
                                    <Button type="button" onClick={() => setAddMemberOpen(true)} className="shrink-0">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Adicionar membro
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {usuarios.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <Users2 className="w-10 h-10 mb-3 opacity-40" />
                                        <p className="text-sm">Nenhum membro cadastrado ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {usuarios.map(u => (
                                            <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg gap-3">
                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                    <span className="font-medium text-sm truncate">{u.nome}</span>
                                                    <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge variant={u.perfil === 'RECEPCIONISTA' ? 'default' : 'secondary'}>
                                                        {u.perfil === 'RECEPCIONISTA' ? 'Recepcionista' : 'Equipe'}
                                                    </Badge>
                                                    <Switch
                                                        checked={u.ativo}
                                                        onCheckedChange={(checked) => handleToggleAtivo(u.id, checked)}
                                                        title={u.ativo ? 'Desativar acesso' : 'Ativar acesso'}
                                                    />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Excluir membro?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta ação removerá permanentemente o acesso de <strong>{u.nome}</strong>. O usuário não conseguirá mais fazer login.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    onClick={() => handleExcluir(u.id)}
                                                                >
                                                                    Excluir
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Dialog para adicionar membro */}
                        <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Adicionar membro</DialogTitle>
                                    <DialogDescription>
                                        Crie uma conta individual para o colaborador. Ele fará login em /login com e-mail e senha.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="novo-nome">Nome completo</Label>
                                        <Input
                                            id="novo-nome"
                                            value={novoMembro.nome}
                                            onChange={e => setNovoMembro(p => ({ ...p, nome: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="novo-email">E-mail</Label>
                                        <Input
                                            id="novo-email"
                                            type="email"
                                            value={novoMembro.email}
                                            onChange={e => setNovoMembro(p => ({ ...p, email: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="novo-senha">Senha padrão</Label>
                                        <Input
                                            id="novo-senha"
                                            type="text"
                                            value={novoMembro.senha}
                                            onChange={e => setNovoMembro(p => ({ ...p, senha: e.target.value }))}
                                            placeholder="Mín. 6 caracteres"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="novo-perfil">Perfil</Label>
                                        <Select
                                            value={novoMembro.perfil}
                                            onValueChange={v => setNovoMembro(p => ({ ...p, perfil: v as 'RECEPCIONISTA' | 'EQUIPE' }))}
                                        >
                                            <SelectTrigger id="novo-perfil">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="RECEPCIONISTA">Recepcionista</SelectItem>
                                                <SelectItem value="EQUIPE">Equipe (Limpeza / Manutenção)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setAddMemberOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="button" onClick={handleCriarMembro} disabled={addingMember}>
                                        {addingMember && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Criar conta
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    {/* TAB 5: Fiscal */}
                    <TabsContent value="fiscal" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurações Fiscais</CardTitle>
                                <CardDescription>
                                    Parâmetros fiscais utilizados nos cálculos de indicadores e relatórios financeiros.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="taxaImpostos"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Total de Impostos (%)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="100"
                                                        placeholder="0.00"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Percentual total de impostos incidentes sobre a receita (ex: ISS, PIS, COFINS). Usado para calcular o lucro líquido nos indicadores.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="p-4 bg-muted/50 border rounded-lg text-center">
                                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h4 className="text-lg font-medium mb-2">Emissão de NFS-e Automática</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Neste momento estamos configurando o seu CNPJ junto a prefeitura da sua cidade. O recurso de emissão de NFSe ficará ativo em breve.
                                    </p>
                                    <Button variant="outline" disabled>Recurso em Implantação</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 6: Assinatura */}
                    <TabsContent value="assinatura" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Plano e Assinatura</CardTitle>
                                <CardDescription>
                                    Gerencie seu plano atual, histórico de faturas e método de pagamento.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="p-4 border rounded-lg border-primary/50 bg-primary/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-primary">Plano Pousada Pro</h4>
                                            <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">Ativo</span>
                                        </div>
                                        <div className="text-3xl font-bold mb-1">R$ 149<span className="text-lg text-muted-foreground font-normal">/mês</span></div>
                                        <p className="text-sm text-muted-foreground mb-4">Próxima cobrança em 05/04/2026</p>
                                        <ul className="space-y-2 text-sm mb-6">
                                            <li className="flex items-center"><CopyCheck className="w-4 h-4 mr-2 text-primary" /> Quartos ilimitados</li>
                                            <li className="flex items-center"><CopyCheck className="w-4 h-4 mr-2 text-primary" /> Motor de Reservas</li>
                                            <li className="flex items-center"><CopyCheck className="w-4 h-4 mr-2 text-primary" /> Financeiro Completo</li>
                                        </ul>
                                        <Button className="w-full" variant="default">Ver Faturas</Button>
                                    </div>
                                    <div className="p-4 border rounded-lg flex flex-col justify-center items-center text-center">
                                        <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
                                        <h4 className="font-medium mb-2">Método de Cobrança</h4>
                                        <p className="text-sm text-muted-foreground mb-4">MasterCard terminado em 1234</p>
                                        <Button variant="outline">Atualizar Cartão</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Floating Save Area / Bottom Bar */}
                <div className="flex items-center justify-end p-4 bg-muted/30 rounded-lg border mt-8">
                    <Button type="submit" size="lg" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Todas as Configurações
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form >
    );
}
