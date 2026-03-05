'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { startOfMonth, endOfMonth, min, max, differenceInCalendarDays, startOfDay, endOfDay, startOfYear, endOfYear, eachMonthOfInterval, format, subYears, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

async function requireAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autorizado')

    const usuario = await prisma.usuario.findUnique({
        where: { supabaseId: user.id },
        select: { pousadaId: true }
    })

    if (!usuario) throw new Error('Usuário não encontrado')
    return { user, pousadaId: usuario.pousadaId }
}

export async function getDashboardMetrics() {
    try {
        const { pousadaId } = await requireAuth()

        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)

        // 1. Busca Acomodacoes para o calculo de ocupacao
        const totalAcomodacoes = await prisma.acomodacao.count({
            where: { pousadaId }
        })

        // 2. Busca todas as reservas que tocam neste mês
        // Condição: Check-in acontece ANTES do fim do mes E Check-out acontece DEPOIS do inicio do mes
        const reservasDoMes = await prisma.reserva.findMany({
            where: {
                pousadaId,
                dataCheckin: { lte: monthEnd },
                dataCheckout: { gte: monthStart }
            }
        })

        let totalReservasMes = 0
        let hospedagensRealizadas = 0
        let reservasCanceladas = 0
        let diasOcupadosNoMes = 0

        for (const r of reservasDoMes) {
            // Conta TODAS as reservas (ativas ou canceladas) p/ KPI principal
            totalReservasMes++

            if (r.status === 'CANCELADA') {
                reservasCanceladas++
            } else {
                // Contabilidade de Checkouts (Realizadas) se o checkout ocorreu neste mes
                if (r.status === 'CHECKOUT_FEITO' && r.dataCheckout >= monthStart && r.dataCheckout <= monthEnd) {
                    hospedagensRealizadas++
                }

                // Calculo de dias de ocupacao restritos as bordas deste mes
                const checkinReal = max([r.dataCheckin, monthStart])
                const checkoutReal = min([r.dataCheckout, monthEnd])

                // Usa diferença em DIAS DE CALENDÁRIO para não perder pernoites menores que 24h (ex: Checkin 14h / Checkout 10h = 20h = 0 dias)
                let diasNoMes = differenceInCalendarDays(checkoutReal, checkinReal)

                // Trata as hospedagens do tipo Day Use (entrou e saiu no mesmo dia) computando 1 diária instalada.
                if (diasNoMes === 0 && r.dataCheckin.getDate() === r.dataCheckout.getDate()) {
                    diasNoMes = 1
                }

                if (diasNoMes > 0) {
                    diasOcupadosNoMes += diasNoMes
                }
            }
        }

        // 3. Calculo da Taxa de Ocupacao
        const diasTotaisDoMes = differenceInCalendarDays(monthEnd, monthStart) + 1
        const capacidadeMaximaDias = totalAcomodacoes * diasTotaisDoMes

        let taxaOcupacao = 0
        if (capacidadeMaximaDias > 0) {
            taxaOcupacao = (diasOcupadosNoMes / capacidadeMaximaDias) * 100
        }

        return {
            totalReservasMes,
            hospedagensRealizadas,
            reservasCanceladas,
            taxaOcupacao: taxaOcupacao.toFixed(1) // formatado "12.5"
        }

    } catch (error) {
        console.error("Erro ao puxar métricas do dashboard:", error)
        return null
    }
}

export async function getDailyOperations() {
    try {
        const { pousadaId } = await requireAuth()

        const now = new Date()
        const todayStart = startOfDay(now)
        const todayEnd = endOfDay(now)

        // Busca reservas ativas que cortam o dia de hoje
        const reservasHoje = await prisma.reserva.findMany({
            where: {
                pousadaId,
                status: {
                    in: ['CONFIRMADA', 'CHECKIN_FEITO']
                },
                dataCheckin: { lte: todayEnd },
                dataCheckout: { gte: todayStart }
            },
            include: {
                hospede: true,
                acomodacao: true
            },
            orderBy: {
                dataCheckin: 'asc'
            }
        })

        const entradas: any[] = []
        const inHouse: any[] = []
        const saidas: any[] = []

        reservasHoje.forEach(r => {
            const checkin = new Date(r.dataCheckin)
            const checkout = new Date(r.dataCheckout)

            if (r.status === 'CONFIRMADA' && checkin >= todayStart && checkin <= todayEnd) {
                entradas.push(r)
            } else if (r.status === 'CHECKIN_FEITO' && checkout >= todayStart && checkout <= todayEnd) {
                saidas.push(r)
            } else if (r.status === 'CHECKIN_FEITO') {
                inHouse.push(r)
            }
        })

        return { entradas, inHouse, saidas }
    } catch (error) {
        console.error("Erro ao puxar operações diárias:", error)
        return { entradas: [], inHouse: [], saidas: [] }
    }
}

export async function getOccupancyChartsData() {
    try {
        const { pousadaId } = await requireAuth()

        const now = new Date()

        const totalAcomodacoes = await prisma.acomodacao.count({
            where: { pousadaId }
        })

        if (totalAcomodacoes === 0) {
            return {
                yearly: [],
                dayComparison: [],
                weekComparison: [],
                monthComparison: []
            }
        }

        const todasReservas = await prisma.reserva.findMany({
            where: {
                pousadaId,
                status: { not: 'CANCELADA' }
            },
            select: {
                dataCheckin: true,
                dataCheckout: true
            }
        })

        // Helper para calcular % de ocupação num intervalo X->Y
        const getOcupacaoNoIntervalo = (start: Date, end: Date) => {
            let ocupados = 0
            for (const r of todasReservas) {
                const checkinReal = max([r.dataCheckin, start])
                const checkoutReal = min([r.dataCheckout, end])

                if (checkinReal < checkoutReal) {
                    ocupados += differenceInCalendarDays(checkoutReal, checkinReal)
                } else if (checkinReal.getTime() === checkoutReal.getTime() && r.dataCheckin.getDate() === r.dataCheckout.getDate()) {
                    // Trata Day use no dia exato dentro da janela
                    if (start <= r.dataCheckin && r.dataCheckin <= end) {
                        ocupados += 1
                    }
                }
            }
            const diasTotais = differenceInCalendarDays(end, start) + 1
            const cap = totalAcomodacoes * diasTotais
            if (cap === 0) return 0
            return Number(((ocupados / cap) * 100).toFixed(1))
        }

        // 1. Mensal do Ano Corrente
        const currentYearStart = startOfYear(now)
        const currentYearEnd = endOfYear(now)
        const months = eachMonthOfInterval({ start: currentYearStart, end: currentYearEnd })

        const yearly = months.map(m => {
            const mStart = startOfMonth(m)
            const mEnd = endOfMonth(m)
            return {
                month: format(m, 'MMM', { locale: ptBR }),
                ocupacao: getOcupacaoNoIntervalo(mStart, mEnd)
            }
        })

        // 2, 3, 4. Comparativos Históricos (Hoje vs Ano-1 vs Ano-2)
        const anosComparar = [0, 1, 2] // 0=Este ano, 1=Ano Passado, 2=Retrasado

        const dayComparison = []
        const weekComparison = []
        const monthComparison = []

        for (const diff of anosComparar) {
            const targetDate = subYears(now, diff)
            const yearStr = format(targetDate, 'yyyy')

            const dStart = startOfDay(targetDate)
            const dEnd = endOfDay(targetDate)
            dayComparison.push({
                year: yearStr,
                ocupacao: getOcupacaoNoIntervalo(dStart, dEnd)
            })

            const wStart = startOfWeek(targetDate)
            const wEnd = endOfWeek(targetDate)
            weekComparison.push({
                year: yearStr,
                ocupacao: getOcupacaoNoIntervalo(wStart, wEnd)
            })

            const mStart = startOfMonth(targetDate)
            const mEnd = endOfMonth(targetDate)
            monthComparison.push({
                year: yearStr,
                ocupacao: getOcupacaoNoIntervalo(mStart, mEnd)
            })
        }

        return {
            // Revertemos para ficar em ordem cronológica p/ os gráficos
            yearly,
            dayComparison: dayComparison.reverse(),
            weekComparison: weekComparison.reverse(),
            monthComparison: monthComparison.reverse()
        }

    } catch (error) {
        console.error("Erro ao puxar dados gráficos", error)
        return null
    }
}
