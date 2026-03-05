'use client'

import { useState, useEffect, useMemo } from 'react'
import { createReserva, getAcomodacoesDisponiveis } from '@/actions/reservas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Check, ChevronsUpDown, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from 'sonner'
import { addDays, format } from 'date-fns'

export function ReservaForm({
    initialData,
    hospedesList,
    acomodacoesList,
    onSuccess,
    onConfirmar,
    onCheckin,
    onCancel,
    onCheckout,
    configPousada
}: {
    initialData?: any,
    hospedesList: any[],
    acomodacoesList: any[],
    onSuccess: () => void,
    onConfirmar?: (id: string) => void,
    onCheckin?: (id: string) => void,
    onCancel?: (id: string) => void,
    onCheckout?: (id: string) => void,
    configPousada?: any
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedHospede, setSelectedHospede] = useState<string>(initialData?.hospedeId || "")
    const [openHospedeCombobox, setOpenHospedeCombobox] = useState(false)
    const [selectedAcomodacoes, setSelectedAcomodacoes] = useState<string[]>(initialData?.acomodacaoId ? [initialData.acomodacaoId] : [])
    const [openAcomodacoesCombobox, setOpenAcomodacoesCombobox] = useState(false)

    // Controle do custom Alert Dialog de Capacidade
    const [isAlertOpen, setIsAlertOpen] = useState(false)
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)

    // Datas defaults controladas
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')

    const [dataCheckin, setDataCheckin] = useState(initialData?.dataCheckin ? format(new Date(initialData.dataCheckin), 'yyyy-MM-dd') : todayStr)
    const [dataCheckout, setDataCheckout] = useState(initialData?.dataCheckout ? format(new Date(initialData.dataCheckout), 'yyyy-MM-dd') : tomorrowStr)
    const [totalHospedesInput, setTotalHospedesInput] = useState<string>(initialData?.totalHospedes?.toString() || "2")
    const [valorTotal, setValorTotal] = useState<string>(initialData?.valorTotal || "")

    // Controle dinâmico anti-overbooking
    const [availableAcomodacoes, setAvailableAcomodacoes] = useState<any[]>([])
    const [isLoadingAcomodacoes, setIsLoadingAcomodacoes] = useState(false)

    // Efeito para re-checar disponibilidade de quartos sempre que trocar as datas ou pessoas!
    useEffect(() => {
        let isMounted = true
        async function fetchDisponibilidade() {
            // Regra Primordial: Requer Datas e Quantidade de Pessoas informadas para liberar os Quartos
            if (initialData?.id || !dataCheckin || !dataCheckout || !totalHospedesInput) {
                if (isMounted) setAvailableAcomodacoes(initialData?.id ? acomodacoesList : [])
                return
            }

            // Garante que Checkout é depois de Checkin na UI para consultar banco
            if (dataCheckin >= dataCheckout || parseInt(totalHospedesInput) <= 0) {
                if (isMounted) setAvailableAcomodacoes([])
                return;
            }

            setIsLoadingAcomodacoes(true)
            const res = await getAcomodacoesDisponiveis(dataCheckin, dataCheckout)

            if (isMounted) {
                if (res.error) {
                    toast.error(res.error)
                    setAvailableAcomodacoes(acomodacoesList) // fallback
                } else if (res.data) {
                    setAvailableAcomodacoes(res.data)
                    // Se os quartos atualmente selecionados NÃO estiverem mais na lista de disponíveis, remove-os da seleção
                    setSelectedAcomodacoes(prev => prev.filter(id => res.data.some((a: any) => a.id === id)))
                }
                setIsLoadingAcomodacoes(false)
            }
        }

        fetchDisponibilidade()
        return () => { isMounted = false }
    }, [dataCheckin, dataCheckout, totalHospedesInput, acomodacoesList, initialData?.id])

    // Sempre que trocar quarto(s) ou datas, calcula o valor base sugerido (soma das diárias x noites)
    // Aplica tarifas dinâmicas se estiverem habilitadas
    useEffect(() => {
        // Se já tiver valor da initialData (Update), não recálcula pra preservar descontos aplicados anteriormente
        if (initialData?.id || selectedAcomodacoes.length === 0 || !dataCheckin || !dataCheckout) return;

        const date1 = new Date(dataCheckin + 'T12:00:00') // meio-dia pra evitar problemas de timezone
        const date2 = new Date(dataCheckout + 'T12:00:00')
        const diffTime = date2.getTime() - date1.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays > 0) {
            // Configurações de tarifas dinâmicas
            const tarifasAtivas = configPousada?.tarifasDinamicasAtivas === true
            const percFds = Number(configPousada?.tarifaFimDeSemana || 0)
            const percFeriado = Number(configPousada?.tarifaFeriado || 0)
            const percTemporada = Number(configPousada?.tarifaTemporada || 0)
            const inicioTemporada = configPousada?.inicioTemporada ? new Date(configPousada.inicioTemporada) : null
            const fimTemporada = configPousada?.fimTemporada ? new Date(configPousada.fimTemporada) : null

            // Lista de feriados nacionais estáticos (ddMM format para comparar independente do ano)
            const feriadosNacionais = [
                '0101', // Ano Novo
                '2102', // Carnaval (variável - em 2025 é 03/03, mas colocamos base)
                '2202', // Carnaval segunda
                '0704', // Paixão de Cristo (variável)
                '2104', // Tiradentes
                '0105', // Dia do Trabalho
                '0706', // Corpus Christi (variável)
                '0709', // Independência do Brasil
                '1210', // Nossa Sra Aparecida
                '0211', // Finados
                '1511', // Proclamação da República
                '2512', // Natal
            ]

            let totalEstimado = 0;
            selectedAcomodacoes.forEach(id => {
                const quarto = acomodacoesList.find(a => a.id === id);
                if (quarto && quarto.valorDiaria) {
                    const diariaBase = Number(quarto.valorDiaria);

                    // Calcular cada noite individualmente
                    for (let i = 0; i < diffDays; i++) {
                        const dia = new Date(date1)
                        dia.setDate(dia.getDate() + i)

                        let diariaDia = diariaBase

                        if (tarifasAtivas) {
                            // Verificar fim de semana (0=Dom, 6=Sab)
                            const diaSemana = dia.getDay()
                            const ehFds = diaSemana === 0 || diaSemana === 6

                            // Verificar feriado nacional
                            const ddMM = String(dia.getDate()).padStart(2, '0') + String(dia.getMonth() + 1).padStart(2, '0')
                            const ehFeriado = feriadosNacionais.includes(ddMM)

                            // Verificar alta temporada
                            let ehTemporada = false
                            if (inicioTemporada && fimTemporada) {
                                // Comparação ignora o ano: converte para dia-mês atual
                                const diaNum = dia.getMonth() * 100 + dia.getDate()
                                const inicioNum = inicioTemporada.getMonth() * 100 + inicioTemporada.getDate()
                                const fimNum = fimTemporada.getMonth() * 100 + fimTemporada.getDate()
                                if (inicioNum <= fimNum) {
                                    // Période normal (ex: Dez -> Mar)
                                    ehTemporada = diaNum >= inicioNum && diaNum <= fimNum
                                } else {
                                    // Période que cruza virada do ano (ex: Nov -> Mar)
                                    ehTemporada = diaNum >= inicioNum || diaNum <= fimNum
                                }
                            }

                            // Acumular porcentagens
                            let percTotal = 0
                            if (ehFds) percTotal += percFds
                            if (ehFeriado) percTotal += percFeriado
                            if (ehTemporada) percTotal += percTemporada

                            if (percTotal > 0) {
                                diariaDia = diariaBase * (1 + percTotal / 100)
                            }
                        }

                        totalEstimado += diariaDia
                    }
                }
            });

            if (totalEstimado > 0) {
                setValorTotal(totalEstimado.toFixed(2));
            } else {
                setValorTotal("");
            }
        }
    }, [selectedAcomodacoes, dataCheckin, dataCheckout, acomodacoesList, initialData?.id, configPousada])

    const capacidadeSelecionada = selectedAcomodacoes.reduce((acc, curr) => acc + (availableAcomodacoes.find((a: any) => a.id === curr)?.capacidade || 0), 0)
    const totalHospedesNum = parseInt(totalHospedesInput || "0")
    const hasEnoughCapacity = capacidadeSelecionada >= totalHospedesNum
    const isReadyToSubmit = selectedAcomodacoes.length > 0

    // Disparado no click de submit no formulário principal
    async function onSubmitWithConfirm(formData: FormData) {
        if (!hasEnoughCapacity && selectedAcomodacoes.length > 0) {
            setPendingFormData(formData) // Preserva os dados pra submeter depois
            setIsAlertOpen(true)         // Abre o modal em vez do alert nativo
            return;
        }

        // Fluxo Normal (Suficiente capacidade)
        await processSubmit(formData)
    }

    // Ação Real do Servidor 
    async function processSubmit(formData: FormData) {
        setIsLoading(true)
        setIsAlertOpen(false) // Garante que a Dialog feche

        const result = await createReserva(formData)

        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            toast.success(result.success)
            onSuccess()
        }
    }

    return (
        <form action={onSubmitWithConfirm} className="space-y-6 py-4">
            {/* Bloco 1: Quando e Quantos? (Estada) */}
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 border-b pb-1">1. Período & Ocupação</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="dataCheckin">Check-in <span className="text-red-500">*</span></Label>
                        <Input
                            id="dataCheckin"
                            name="dataCheckin"
                            type="date"
                            value={dataCheckin}
                            onChange={(e) => setDataCheckin(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dataCheckout">Check-out <span className="text-red-500">*</span></Label>
                        <Input
                            id="dataCheckout"
                            name="dataCheckout"
                            type="date"
                            value={dataCheckout}
                            onChange={(e) => setDataCheckout(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="totalHospedes">Qtd Pessoas <span className="text-red-500">*</span></Label>
                        <Input
                            id="totalHospedes"
                            name="totalHospedes"
                            type="number"
                            min={1}
                            value={totalHospedesInput}
                            onChange={(e) => setTotalHospedesInput(e.target.value)}
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Bloco 2: Onde? (Acomodações Selecionáveis) */}
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 border-b pb-1">2. Seleção de Quartos</h3>
                <div className="space-y-2">
                    <Label htmlFor="acomodacaoIds">Acomodações (Quartos) <span className="text-red-500">*</span></Label>
                    <input type="hidden" name="acomodacaoIds" value={JSON.stringify(selectedAcomodacoes)} />

                    <Popover open={openAcomodacoesCombobox} onOpenChange={setOpenAcomodacoesCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openAcomodacoesCombobox}
                                className="w-full justify-between font-normal h-auto min-h-[40px] whitespace-normal text-left"
                                disabled={isLoadingAcomodacoes || availableAcomodacoes.length === 0 || !dataCheckin || !dataCheckout || !totalHospedesInput}
                            >
                                {isLoadingAcomodacoes
                                    ? "Buscando..."
                                    : (!dataCheckin || !dataCheckout || !totalHospedesInput)
                                        ? "Preencha o Topo Primeiro"
                                        : availableAcomodacoes.length === 0
                                            ? "Sem vagas pro período selecionado"
                                            : selectedAcomodacoes.length > 0
                                                ? <span className="text-primary font-medium">{selectedAcomodacoes.length} quarto(s) selecionado(s)</span>
                                                : "Selecione o(s) Quartos(s)..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[100%] md:w-[400px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Buscar quarto por nome, tipo..." />
                                <CommandList className="max-h-[300px] overflow-auto">
                                    <CommandEmpty>Nenhuma acomodação correspondente.</CommandEmpty>
                                    <CommandGroup>
                                        {availableAcomodacoes.map((ac: any) => {
                                            const isSelected = selectedAcomodacoes.includes(ac.id);
                                            return (
                                                <CommandItem
                                                    key={ac.id}
                                                    value={`${ac.nome} ${ac.tipo}`} // para busca textual
                                                    onSelect={() => {
                                                        setSelectedAcomodacoes(prev =>
                                                            isSelected
                                                                ? prev.filter(id => id !== ac.id)
                                                                : [...prev, ac.id]
                                                        )
                                                    }}
                                                >
                                                    <div className={cn(
                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                    )}>
                                                        <Check className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1">
                                                            <span>{ac.nome}</span>
                                                            <span className={cn(
                                                                "text-xs ml-1 px-1.5 py-0.5 rounded-sm inline-flex items-center gap-1",
                                                                (ac.capacidade < totalHospedesNum) ? "bg-red-100 text-red-700 font-medium" : "bg-muted text-muted-foreground"
                                                            )}>
                                                                {(ac.capacidade < totalHospedesNum) && <AlertTriangle className="h-3 w-3" />}
                                                                Capacidade: {ac.capacidade} pax
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">{ac.tipo} {ac.valorDiaria ? `- Diária: R$ ${Number(ac.valorDiaria).toFixed(2).replace('.', ',')}` : ''}</span>
                                                    </div>
                                                </CommandItem>
                                            )
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {/* Sumário Auxiliar */}
                    {selectedAcomodacoes.length > 0 && availableAcomodacoes.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                            Soma de lugares selecionados: <strong>{selectedAcomodacoes.reduce((acc, curr) => acc + (availableAcomodacoes.find((a: any) => a.id === curr)?.capacidade || 0), 0)} lugares</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* Bloco 3: Para quem e Quanto? (Identificação e Total) */}
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 border-b pb-1">3. Vínculo do Titular & Acertos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="hospedeId">Hóspede (Titular) <span className="text-red-500">*</span></Label>
                        {/* Input hidden pra garantir que o FormData do Server Action pegue o ID mesmo sendo um botão de Combobox */}
                        <input type="hidden" name="hospedeId" value={selectedHospede} className="hidden" />

                        <Popover open={openHospedeCombobox} onOpenChange={setOpenHospedeCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openHospedeCombobox}
                                    className="w-full justify-between font-normal"
                                >
                                    {selectedHospede
                                        ? selectedHospede === "NOVO_HOSPEDE"
                                            ? "+ Cadastrar Novo Hóspede"
                                            : (hospedesList.find((h) => h.id === selectedHospede)?.nome || "Hóspede não encontrado")
                                        : "Selecione o Cliente..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[100%] md:w-[400px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Buscar por nome ou CPF..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum hóspede encontrado com esta busca.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="NOVO_HOSPEDE"
                                                onSelect={() => {
                                                    setSelectedHospede("NOVO_HOSPEDE")
                                                    setOpenHospedeCombobox(false)
                                                }}
                                                className="font-bold text-primary"
                                            >
                                                <Check
                                                    className={cn("mr-2 h-4 w-4", selectedHospede === "NOVO_HOSPEDE" ? "opacity-100" : "opacity-0")}
                                                />
                                                + Cadastrar Novo Hóspede
                                            </CommandItem>
                                            {hospedesList.map((h) => (
                                                <CommandItem
                                                    key={h.id}
                                                    value={`${h.nome} ${h.cpf || ''} ${h.id}`} // O value aqui é usado pelo comando internamente para filtro textual
                                                    onSelect={() => {
                                                        setSelectedHospede(h.id)
                                                        setOpenHospedeCombobox(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn("mr-2 h-4 w-4", selectedHospede === h.id ? "opacity-100" : "opacity-0")}
                                                    />
                                                    {h.nome} {h.cpf ? `(${h.cpf})` : ''}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Collapse Cadastro Rápido Hóspede */}
                {selectedHospede === 'NOVO_HOSPEDE' && (
                    <div className="mt-4 p-4 rounded-md border bg-muted/30 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2 lg:col-span-3 text-sm text-muted-foreground mb-[-8px]">
                            Registro Rápido de Cliente:
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="novoHospedeNome">Nome Completo <span className="text-red-500">*</span></Label>
                            <Input id="novoHospedeNome" name="novoHospedeNome" required placeholder="Ex: Maria Silva" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="novoHospedeCpf">CPF</Label>
                            <Input id="novoHospedeCpf" name="novoHospedeCpf" placeholder="000.000.000-00" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="novoHospedeTelefone">Telefone / Whats</Label>
                            <Input id="novoHospedeTelefone" name="novoHospedeTelefone" placeholder="(11) 90000-0000" />
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4">

                <div className="space-y-2">
                    <Label htmlFor="valorTotal">Valor Total Estimado do(s) Quarto(s) (R$) <span className="text-red-500">*</span></Label>
                    <Input
                        id="valorTotal"
                        name="valorTotal"
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="Ex: 550.00"
                        value={valorTotal}
                        onChange={(e) => setValorTotal(e.target.value)}
                        required
                    />
                    {/* Badge indicador de Tarifas Dinamicas aplicadas */}
                    {!initialData?.id && configPousada?.tarifasDinamicasAtivas && selectedAcomodacoes.length > 0 && dataCheckin && dataCheckout && (() => {
                        // Recalcular badges para exibicão
                        const feriadosNacionais = ['0101', '2102', '2202', '0704', '2104', '0105', '0706', '0709', '1210', '0211', '1511', '2512']
                        const percFds = Number(configPousada?.tarifaFimDeSemana || 0)
                        const percFeriado = Number(configPousada?.tarifaFeriado || 0)
                        const percTemporada = Number(configPousada?.tarifaTemporada || 0)
                        const inicioTemporada = configPousada?.inicioTemporada ? new Date(configPousada.inicioTemporada) : null
                        const fimTemporada = configPousada?.fimTemporada ? new Date(configPousada.fimTemporada) : null
                        const date1 = new Date(dataCheckin + 'T12:00:00')
                        const date2 = new Date(dataCheckout + 'T12:00:00')
                        const diffDays = Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24))
                        let temFds = false, temFeriado = false, temTemporada = false
                        for (let i = 0; i < diffDays; i++) {
                            const dia = new Date(date1)
                            dia.setDate(dia.getDate() + i)
                            const dow = dia.getDay()
                            if (dow === 0 || dow === 6) temFds = true
                            const ddMM = String(dia.getDate()).padStart(2, '0') + String(dia.getMonth() + 1).padStart(2, '0')
                            if (feriadosNacionais.includes(ddMM)) temFeriado = true
                            if (inicioTemporada && fimTemporada) {
                                const dNum = dia.getMonth() * 100 + dia.getDate()
                                const iNum = inicioTemporada.getMonth() * 100 + inicioTemporada.getDate()
                                const fNum = fimTemporada.getMonth() * 100 + fimTemporada.getDate()
                                if (iNum <= fNum ? (dNum >= iNum && dNum <= fNum) : (dNum >= iNum || dNum <= fNum)) temTemporada = true
                            }
                        }
                        const badges = []
                        if (temFds && percFds > 0) badges.push(`+${percFds}% Fim de Semana`)
                        if (temFeriado && percFeriado > 0) badges.push(`+${percFeriado}% Feriado`)
                        if (temTemporada && percTemporada > 0) badges.push(`+${percTemporada}% Alta Temporada`)
                        if (badges.length === 0) return null
                        return (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                <span className="text-xs text-muted-foreground mr-1">Tarifas aplicadas:</span>
                                {badges.map(b => (
                                    <span key={b} className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">{b}</span>
                                ))}
                            </div>
                        )
                    })()}
                </div>
            </div>

            <div className="space-y-2 mt-4">
                <Label htmlFor="observacoes">Anotações da Reserva (Vistas pra Equipe)</Label>
                <Input
                    id="observacoes"
                    name="observacoes"
                    placeholder="Ex: Chegará tarde (madrugada). Preparar berço no quarto."
                    defaultValue={initialData?.observacoes}
                />
            </div>

            {!hasEnoughCapacity && selectedAcomodacoes.length > 0 && (
                <div className="flex justify-end px-1 -mb-2">
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Atenção: Capacidade dos quartos ({capacidadeSelecionada}) é menor que a quantidade total de hóspedes ({totalHospedesNum})
                    </span>
                </div>
            )}

            <div className="flex justify-end pt-4 gap-2 w-full items-center">
                {/* AÇÕES EXTRAS SE FOR EDIÇÃO/VISUALIZAÇÃO */}
                {initialData?.id && initialData.status === 'PENDENTE' && onConfirmar && (
                    <Button type="button" variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-none mr-auto" onClick={() => onConfirmar(initialData.id)}>
                        Confirmar Reserva
                    </Button>
                )}
                {initialData?.id && initialData.status === 'CONFIRMADA' && onCheckin && (
                    <Button type="button" variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none mr-auto" onClick={() => onCheckin(initialData.id)}>
                        Fazer Check-in
                    </Button>
                )}
                {initialData?.id && initialData.status === 'CHECKIN_FEITO' && onCheckout && (
                    <Button type="button" variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none mr-auto" onClick={() => onCheckout(initialData.id)}>
                        Pagar e Check-out
                    </Button>
                )}

                {initialData?.id && (initialData.status === 'CONFIRMADA' || initialData.status === 'PENDENTE') && onCancel && (
                    <Button type="button" variant="destructive" onClick={() => onCancel(initialData.id)}>
                        Cancelar Reserva
                    </Button>
                )}

                <Button variant="outline" type="button" onClick={onSuccess}>
                    {initialData?.id ? 'Fechar' : 'Cancelar'}
                </Button>

                {!initialData?.id && (
                    <Button type="submit" disabled={isLoading || !isReadyToSubmit}>
                        {isLoading ? 'Registrando...' : 'Confirmar Reserva'}
                    </Button>
                )}
            </div>

            {/* Custom UI para Alerta de Capacidade do Overbooking de Hóspedes */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Atenção com a Capacidade
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            A soma da capacidade dos quartos selecionados comportam apenas <strong>{capacidadeSelecionada} pessoa(s)</strong>.
                            Você está tentando registrar uma reserva para <strong>{totalHospedesNum} hóspedes</strong>.
                            <br /><br />
                            Deseja confirmar a reserva ignorando esta restrição técnica?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingFormData(null)}>Revisar Quartos</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (pendingFormData) processSubmit(pendingFormData)
                        }}>
                            Confirmar Reserva Mesmo Assim
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </form>
    )
}
