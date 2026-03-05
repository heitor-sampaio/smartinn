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
        <div className="space-y-4">
            {/* Gráfico 1 - Progresso do Ano */}
            <Card>
                <CardHeader>
                    <CardTitle>Evolução da Ocupação</CardTitle>
                    <CardDescription>
                        Taxa de Ocupação mês a mês (Ano Corrente)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ChartContainer config={chartConfigPrincipal} className="h-full w-full">
                            <LineChart accessibilityLayer data={data.yearly} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
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
                                    tickFormatter={(value) => `${value}%`}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dashed" />}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="ocupacao"
                                    stroke="var(--color-ocupacao)"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "var(--color-ocupacao)" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Gráficos 2, 3 e 4 - Comparativos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Dia vs Anos Ant.</CardTitle>
                        <CardDescription>Ocupação neste exato dia.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            <ChartContainer config={chartConfigSecundario} className="h-full w-full">
                                <LineChart accessibilityLayer data={data.dayComparison} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="year" tickLine={false} tickMargin={10} axisLine={false} />
                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                    <Line type="monotone" dataKey="ocupacao" stroke="var(--color-ocupacao)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-ocupacao)" }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Semana vs Anos Ant.</CardTitle>
                        <CardDescription>Ocupação nesta semana.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            <ChartContainer config={chartConfigSecundario} className="h-full w-full">
                                <LineChart accessibilityLayer data={data.weekComparison} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="year" tickLine={false} tickMargin={10} axisLine={false} />
                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                    <Line type="monotone" dataKey="ocupacao" stroke="var(--color-ocupacao)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-ocupacao)" }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Mês vs Anos Ant.</CardTitle>
                        <CardDescription>Ocupação neste mês.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            <ChartContainer config={chartConfigSecundario} className="h-full w-full">
                                <LineChart accessibilityLayer data={data.monthComparison} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="year" tickLine={false} tickMargin={10} axisLine={false} />
                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                    <Line type="monotone" dataKey="ocupacao" stroke="var(--color-ocupacao)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-ocupacao)" }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
