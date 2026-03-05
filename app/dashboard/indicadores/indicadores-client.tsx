'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, BarChart, Bar, Cell } from "recharts"
import { BedDouble, LineChart, CalendarDays, Users } from 'lucide-react'

interface IndicatorsData {
    adr: string;
    revpar: string;
    leadTime: string;
    cancelationRate: string;
    mediaFaturamentoMensal: string;
    mediaFaturamentoSemanal: string;
    receitaMediaMensalConsumo: string;
    receitaExtraPorHospedagem: string;
    itemMaisConsumido: string;
    custoMedioMensalManutencao: string;
    totalReceitaAno: string;
    revenueChartData: any[];
    statusChartData: any[];
    bookingsPerMonthData: any[];
}

const chartConfigReceita = {
    receita: {
        label: "Receita",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig

const chartConfigStatus = {
    efetivadas: {
        label: "Efetivadas",
        color: "hsl(var(--primary))",
    },
    canceladas: {
        label: "Canceladas",
        color: "hsl(var(--destructive))",
    },
} satisfies ChartConfig

const chartConfigBookings = {
    _count: {
        label: "Reservas",
        color: "hsl(var(--primary))",
    }
} satisfies ChartConfig

export function DashboardIndicators({ data }: { data: any | null }) {
    if (!data || data._globalError) return (
        <div className="text-center py-10 text-muted-foreground">
            {data?._globalError ? (
                <div className="text-red-500 font-bold p-4 bg-red-100/20 rounded">
                    Erro no Servidor: {data._globalError}
                </div>
            ) : (
                "Sem dados suficientes para calcular indicadores."
            )}
        </div>
    )

    return (
        <div className="space-y-6 overflow-x-hidden">
            {/* Bloco 1: Desempenho de Hospedagem */}
            <h3 className="text-lg font-medium pt-2 border-b pb-2">Desempenho de Hospedagem</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-bold">R$ {data.adr}</CardTitle>
                        <CardDescription>Valor Médio da Diária (ADR)</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground pt-0">
                        O preço médio pago por noite de estadia
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-bold">R$ {data.revpar}</CardTitle>
                        <CardDescription>Receita por Quarto (RevPAR)</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground pt-0">
                        Quanto cada quarto gerou, contando as noites vazias
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-bold">{data.leadTime} dias</CardTitle>
                        <CardDescription>Antecedência das Reservas</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground pt-0">
                        Dias antes do check-in que os hóspedes costumam reservar
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-bold text-destructive">{data.cancelationRate}%</CardTitle>
                        <CardDescription>Taxa de Cancelamentos</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground pt-0">
                        Porcentagem de reservas totais que foram canceladas
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos Secundários relativos à Hospedagem */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gráfico 2 - Volume de Reservas Mês a Mês */}
                <Card>
                    <CardHeader>
                        <CardTitle>Volume de Reservas (Ano Atual)</CardTitle>
                        <CardDescription>
                            Quantidade de diárias fechadas em cada mês
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full overflow-hidden">
                            <ChartContainer config={chartConfigBookings} className="h-full w-full">
                                <BarChart accessibilityLayer data={data.bookingsPerMonthData} margin={{ top: 20, right: 0, left: -30, bottom: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="_count" fill="var(--color-_count)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Gráfico 3 - Taxa de Cancelamentos Global */}
                <Card>
                    <CardHeader>
                        <CardTitle>Comportamento do Cliente</CardTitle>
                        <CardDescription>Percentual Histórico de Cancelamentos (Doughnut)</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-0">
                        <div className="h-[250px] w-full max-w-[300px]">
                            <ChartContainer config={chartConfigStatus} className="h-full w-full">
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={data.statusChartData}
                                        dataKey="_count"
                                        nameKey="status"
                                        innerRadius={60}
                                        outerRadius={80}
                                        stroke="none"
                                    >
                                        {data.statusChartData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bloco 2: Resultado Financeiro */}
            <h3 className="text-lg font-medium pt-4 border-b pb-2">Resultado Financeiro Global</h3>
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold">R$ {data.mediaFaturamentoMensal}</CardTitle>
                        <CardDescription>Faturamento Médio por Mês</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground pt-0">
                        Valor médio recebido em diárias por mês neste ano
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold">R$ {data.mediaFaturamentoSemanal}</CardTitle>
                        <CardDescription>Faturamento Médio por Semana</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground pt-0">
                        Valor médio recebido em diárias por semana neste ano
                    </CardContent>
                </Card>
                <Card className="bg-destructive/5 dark:bg-destructive/10 border-destructive/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold text-destructive">R$ {data.custoMedioMensalManutencao}</CardTitle>
                        <CardDescription>Custo Médio com Manutenção</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground pt-0">
                        Gasto médio por mês reparando a pousada
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico de Faturamento */}
            <Card>
                <CardHeader>
                    <CardTitle>Desempenho de Receita (Bruta)</CardTitle>
                    <CardDescription>
                        Faturamento de reservas consolidadas neste ano (Total: R$ {data.totalReceitaAno})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] md:h-[350px] w-full overflow-hidden">
                        <ChartContainer config={chartConfigReceita} className="h-full w-full">
                            <AreaChart accessibilityLayer data={data.revenueChartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `R$${value}`}
                                    width={60}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="line" />}
                                />
                                <Area
                                    dataKey="receita"
                                    type="monotone"
                                    fill="var(--color-receita)"
                                    fillOpacity={0.4}
                                    stroke="var(--color-receita)"
                                />
                            </AreaChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Bloco 3: Consumo e Extras */}
            <h3 className="text-lg font-medium pt-4 border-b pb-2">Consumos Extras dos Hóspedes</h3>
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold">R$ {data.receitaMediaMensalConsumo}</CardTitle>
                        <CardDescription>Receita Média com Extras por Mês</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground pt-0">
                        Valor total do que foi pago a mais em consumo
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold text-green-600">R$ {data.receitaExtraPorHospedagem}</CardTitle>
                        <CardDescription>Gasto Extra por Hospedagem</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground pt-0">
                        Média de dinheiro que cada hóspede deixa além da diária
                    </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20 flex flex-col justify-center">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary font-medium flex items-center gap-1">
                            ⭐ Produto Campeão
                        </CardDescription>
                        <CardTitle className="text-base leading-tight mt-1">
                            {data.itemMaisConsumido}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground pt-0">
                        O item extra mais vendido no ano até agora
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
