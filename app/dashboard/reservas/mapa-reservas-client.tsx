import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, BedDouble, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MapaReservasProps {
    reservas: any[]
    acomodacoes: any[]
    onReservaClick: (reservaId: string) => void
}

export function MapaReservasClient({
    reservas, acomodacoes, onReservaClick
}: MapaReservasProps) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

    // Calcula os dias do mês atual visualizado
    const daysInMonth = useMemo(() => {
        const start = startOfMonth(currentDate)
        const end = endOfMonth(currentDate)
        return eachDayOfInterval({ start, end })
    }, [currentDate])

    // Determina a cor baseada no status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDENTE': return 'bg-yellow-200 text-yellow-800 border-yellow-300'
            case 'CONFIRMADA': return 'bg-blue-200 text-blue-800 border-blue-300'
            case 'CHECKIN_FEITO': return 'bg-emerald-200 text-emerald-800 border-emerald-300'
            case 'CHECKOUT_FEITO': return 'bg-slate-200 text-slate-700 border-slate-300'
            case 'CANCELADA': return 'bg-red-200 text-red-800 border-red-300'
            default: return 'bg-gray-200 border-gray-300'
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Mapa de Ocupação
                </h3>
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-32 text-center font-semibold capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </div>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative">
                    <div className="inline-block min-w-full">
                        {/* Header do Calendario (Dias) */}
                        <div className="flex bg-muted/50 border-b sticky top-0 z-20">
                            {/* Célula Fixa das Acomodações */}
                            <div className="w-48 flex-shrink-0 p-3 font-semibold text-sm border-r bg-muted/80 backdrop-blur sticky left-0 z-30 flex items-center">
                                Acomodação
                            </div>
                            {/* Loop de Dias */}
                            <div className="flex flex-grow">
                                {daysInMonth.map((day, idx) => (
                                    <div key={idx} className="w-8 md:w-10 flex-shrink-0 p-1 text-center border-r last:border-r-0 flex flex-col items-center justify-center">
                                        <span className="text-[10px] text-muted-foreground">{format(day, 'E', { locale: ptBR }).charAt(0)}</span>
                                        <span className="font-medium text-xs md:text-sm">{format(day, 'd')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Corpo do Calendario (Acomodações = Linhas) */}
                        <div className="flex flex-col relative z-0">
                            {acomodacoes.map((acomodacao) => {
                                // Reservas desta acomodação ativas neste mês
                                const reservasDaAcomodacao = reservas.filter(r => r.acomodacaoId === acomodacao.id)

                                return (
                                    <div key={acomodacao.id} className="flex border-b last:border-b-0 hover:bg-muted/10 group relative h-14">
                                        {/* Célula Título Acomodação */}
                                        <div className="w-48 flex-shrink-0 p-3 text-sm text-foreground font-medium border-r bg-card group-hover:bg-muted/30 sticky left-0 z-10 flex items-center space-x-2">
                                            <BedDouble className="h-4 w-4 text-muted-foreground" />
                                            <span className="truncate">{acomodacao.nome}</span>
                                        </div>

                                        {/* Células de Fundo (Dias) */}
                                        <div className="flex flex-grow relative">
                                            {daysInMonth.map((day, idx) => (
                                                <div key={idx} className="w-8 md:w-10 flex-shrink-0 border-r last:border-r-0 bg-transparent h-full relative" />
                                            ))}

                                            {/* Renderização das Barras de Reserva (Camada Sobreposta) */}
                                            {reservasDaAcomodacao.map(reserva => {
                                                const checkin = typeof reserva.dataCheckin === 'string' ? parseISO(reserva.dataCheckin) : reserva.dataCheckin
                                                const checkout = typeof reserva.dataCheckout === 'string' ? parseISO(reserva.dataCheckout) : reserva.dataCheckout

                                                // Verifica se cruza com o mês atual renderizado
                                                const monthStart = daysInMonth[0]
                                                const monthEnd = daysInMonth[daysInMonth.length - 1]

                                                if (checkout < monthStart || checkin > monthEnd || reserva.status === 'CANCELADA') {
                                                    return null // Fora do escopo visual
                                                }

                                                // Calcula posições com base no index do array de dias
                                                let startIdx = daysInMonth.findIndex(d => isSameDay(d, checkin))
                                                let endIdx = daysInMonth.findIndex(d => isSameDay(d, checkout))

                                                // Lida com estadias que cortam meses
                                                let isCutLeft = false
                                                let isCutRight = false

                                                if (startIdx === -1 && checkin < monthStart) {
                                                    startIdx = 0
                                                    isCutLeft = true
                                                }
                                                if (endIdx === -1 && checkout > monthEnd) {
                                                    endIdx = daysInMonth.length - 1
                                                    isCutRight = true
                                                }

                                                // Cada coluna (dia) tem W-8 (32px) ou W-10 (40px)
                                                // O ideal aqui num client-side block seria medir no DOM (ResizeObserver),
                                                // mas como é Tailwind, usaremos um valor fixo seguro para telas médias/grandes (onde ocorre a queixa de scroll).
                                                // Se usarmos 'min-width' e flex, podemos simplificar pro mobile tb, mas vamos cravar 40px pro desktop e 32 pro mobile.
                                                // Assumindo telas de computador primariamente pro app:
                                                const CELL_WIDTH = typeof window !== 'undefined' && window.innerWidth < 768 ? 32 : 40
                                                const duration = endIdx - startIdx + 1

                                                // Lógica Módulo 10: Check-in começa no meio do quadrado (14h)
                                                // Se for cortado à esquerda (a reserva já vem do mês anterior), começa do 0.
                                                const startOffset = isCutLeft ? 0 : (CELL_WIDTH / 2)
                                                const leftPos = (startIdx * CELL_WIDTH) + startOffset

                                                // Lógica Módulo 10: Check-out termina no meio do quadrado (10h)
                                                // Logo, a largura total perde a metade do dia de Entrada + a metade do dia de Saída (totalizando -1 CELL_WIDTH).
                                                // Se estiver cortado (vem do passado ou vai pro futuro), não subtrai a margem daquele lado.
                                                let widthDeduction = 0
                                                if (!isCutLeft) widthDeduction += (CELL_WIDTH / 2)
                                                if (!isCutRight) widthDeduction += (CELL_WIDTH / 2)

                                                const width = (duration * CELL_WIDTH) - widthDeduction

                                                const colorClass = getStatusColor(reserva.status)

                                                return (
                                                    <div
                                                        key={reserva.id}
                                                        onClick={() => onReservaClick(reserva.id)}
                                                        className={`absolute top-2 bottom-2 border rounded-md shadow-sm opacity-90 hover:opacity-100 hover:z-20 hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-center px-2 py-1 overflow-hidden group/bar ${colorClass} ${isCutLeft ? 'rounded-l-none border-l-0' : ''} ${isCutRight ? 'rounded-r-none border-r-0' : ''}`}
                                                        style={{
                                                            left: `${leftPos}px`,
                                                            width: `${width}px`,
                                                            zIndex: 10
                                                        }}
                                                        title={`Reserva #${reserva.id.slice(0, 6)} - ${reserva.hospede.nome} (${reserva.status})`}
                                                    >
                                                        <span className="text-xs font-semibold truncate leading-tight">
                                                            {reserva.hospede.nome}
                                                        </span>
                                                        <span className="text-[10px] uppercase opacity-75 truncate leading-tight">
                                                            {reserva.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Legenda */}
                <div className="bg-muted/30 p-3 border-t flex items-center justify-center space-x-6 text-xs text-muted-foreground flex-wrap gap-y-2">
                    <div className="flex items-center"><div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-300 mr-2" /> Pendente / Orçamento</div>
                    <div className="flex items-center"><div className="w-3 h-3 rounded bg-blue-200 border border-blue-300 mr-2" /> Confirmada</div>
                    <div className="flex items-center"><div className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300 mr-2" /> In-House (Check-in)</div>
                    <div className="flex items-center"><div className="w-3 h-3 rounded bg-slate-200 border border-slate-300 mr-2" /> Histórico (Check-out)</div>
                </div>
            </div>
        </div>
    )
}
