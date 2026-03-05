'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, LogIn, LogOut, BedDouble } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface KanbanColumnProps {
    title: string
    icon: React.ReactNode
    items: any[]
    colorClass: string
}

export function KanbanDiario({
    entradas,
    inHouse,
    saidas
}: {
    entradas: any[]
    inHouse: any[]
    saidas: any[]
}) {
    // Componente interno para as colunas do Kanban
    const KanbanColumn = ({ title, icon, items, colorClass }: KanbanColumnProps) => (
        <div className="flex flex-col bg-muted/30 rounded-lg border p-3 md:p-4 min-h-[180px] md:min-h-[400px]">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
                <div className="flex items-center space-x-2 font-semibold">
                    {icon}
                    <span>{title}</span>
                </div>
                <Badge variant="secondary" className="rounded-full">
                    {items.length}
                </Badge>
            </div>

            <div className="flex flex-col space-y-3 flex-grow overflow-y-auto">
                {items.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground mt-8">
                        Nenhum registro hoje.
                    </div>
                ) : (
                    items.map((reserva) => (
                        <Card key={reserva.id} className={`overflow-hidden border-l-4 ${colorClass} hover:shadow-md transition-shadow`}>
                            <CardHeader className="p-3 pb-1">
                                <CardTitle className="text-sm font-bold flex justify-between items-start">
                                    <span className="truncate pr-2" title={reserva.hospede.nome}>
                                        {reserva.hospede.nome}
                                    </span>
                                </CardTitle>
                                <CardDescription className="text-xs flex items-center pt-1 text-foreground">
                                    <BedDouble className="h-3 w-3 mr-1 text-muted-foreground" />
                                    {reserva.acomodacao.nome}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {format(new Date(reserva.dataCheckin), "dd MMM", { locale: ptBR })} - {format(new Date(reserva.dataCheckout), "dd/MM")}
                                    </div>
                                    <div className="font-medium text-foreground">
                                        {reserva.totalHospedes} pax
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )

    return (
        <div className="mt-4 md:mt-8 space-y-4">
            <h3 className="text-lg md:text-xl font-bold tracking-tight">Operações de Hoje</h3>
            <p className="text-sm text-muted-foreground mb-4">
                Quadro de movimentações previstas para a data atual.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <KanbanColumn
                    title="Saídas (Check-out)"
                    icon={<LogOut className="h-5 w-5 text-slate-600" />}
                    items={saidas}
                    colorClass="border-slate-500"
                />
                <KanbanColumn
                    title="Permanências (In-House)"
                    icon={<BedDouble className="h-5 w-5 text-emerald-500" />}
                    items={inHouse}
                    colorClass="border-emerald-500"
                />
                <KanbanColumn
                    title="Chegadas (Check-in)"
                    icon={<LogIn className="h-5 w-5 text-blue-500" />}
                    items={entradas}
                    colorClass="border-blue-500"
                />
            </div>
        </div>
    )
}
