'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

interface OccupancyData {
    yearly: any[]
    dayComparison: any[]
    weekComparison: any[]
    monthComparison: any[]
}

const chartConfigPrincipal = {
    ocupacao: {
        label: "Ocupação (%)",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig

const chartConfigSecundario = {
    ocupacao: {
        label: "Ocupação (%)",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig

export function OccupancyCharts({ data }: { data: OccupancyData | null }) {
    if (!data) return null

    return (
        <div className="space-y-3 md:space-y-4">
            {/* Gráfico 1 - Progresso do Ano */}
            <Card>
                <CardHeader className="pb-2 pt-4 px-4 md:px-6 md:pt-6">
                    <CardTitle className="text-sm md:text-base">Evolução da Ocupação</CardTitle>
                    <CardDescription className="hidden md:block">
                        Taxa de Ocupação mês a mês (Ano Corrente)
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-2 md:px-6 pb-4">
                    <div className="h-[160px] md:h-[250px] w-full overflow-hidden">
                        <ChartContainer config={chartConfigPrincipal} className="h-full w-full">
                            <LineChart accessibilityLayer data={data.yearly} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    tickMargin={8}
                                    axisLine={false}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}%`}
                                    tick={{ fontSize: 10 }}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dashed" />}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="ocupacao"
                                    stroke="var(--color-ocupacao)"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "var(--color-ocupacao)" }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Gráficos 2, 3 e 4 - Comparativos: 2 colunas no mobile, 3 no desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <Card>
                    <CardHeader className="pb-1 pt-3 px-3 md:px-6 md:pt-6 md:pb-2">
                        <CardTitle className="text-xs md:text-base">Dia vs Ant.</CardTitle>
                        <CardDescription className="hidden md:block text-xs">Ocupação neste exato dia.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-1 md:px-6 pb-3">
                        <div className="h-[120px] md:h-[200px] w-full overflow-hidden">
                            <ChartContainer config={chartConfigSecundario} className="h-full w-full">
                                <LineChart accessibilityLayer data={data.dayComparison} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="year" tickLine={false} tickMargin={6} axisLine={false} tick={{ fontSize: 9 }} />
                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 9 }} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                    <Line type="monotone" dataKey="ocupacao" stroke="var(--color-ocupacao)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-ocupacao)" }} activeDot={{ r: 4 }} />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-1 pt-3 px-3 md:px-6 md:pt-6 md:pb-2">
                        <CardTitle className="text-xs md:text-base">Semana vs Ant.</CardTitle>
                        <CardDescription className="hidden md:block text-xs">Ocupação nesta semana.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-1 md:px-6 pb-3">
                        <div className="h-[120px] md:h-[200px] w-full overflow-hidden">
                            <ChartContainer config={chartConfigSecundario} className="h-full w-full">
                                <LineChart accessibilityLayer data={data.weekComparison} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="year" tickLine={false} tickMargin={6} axisLine={false} tick={{ fontSize: 9 }} />
                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 9 }} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                    <Line type="monotone" dataKey="ocupacao" stroke="var(--color-ocupacao)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-ocupacao)" }} activeDot={{ r: 4 }} />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2 md:col-span-1">
                    <CardHeader className="pb-1 pt-3 px-3 md:px-6 md:pt-6 md:pb-2">
                        <CardTitle className="text-xs md:text-base">Mês vs Ant.</CardTitle>
                        <CardDescription className="hidden md:block text-xs">Ocupação neste mês.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-1 md:px-6 pb-3">
                        <div className="h-[120px] md:h-[200px] w-full overflow-hidden">
                            <ChartContainer config={chartConfigSecundario} className="h-full w-full">
                                <LineChart accessibilityLayer data={data.monthComparison} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="year" tickLine={false} tickMargin={6} axisLine={false} tick={{ fontSize: 9 }} />
                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 9 }} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                    <Line type="monotone" dataKey="ocupacao" stroke="var(--color-ocupacao)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-ocupacao)" }} activeDot={{ r: 4 }} />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
