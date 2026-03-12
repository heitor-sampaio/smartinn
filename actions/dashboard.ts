'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { startOfMonth, endOfMonth, min, max, differenceInCalendarDays, startOfDay, endOfDay, startOfYear, endOfYear, eachMonthOfInterval, format, subYears, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { requireAuth } from '@/lib/auth'

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
        let reservasCanceladas = 0
        let reservasNoShow = 0
        let diasOcupadosNoMes = 0

        for (const r of reservasDoMes) {
            totalReservasMes++

            if (r.status === 'CANCELADA') {
                reservasCanceladas++
            } else if (r.status === 'NO_SHOW') {
                reservasNoShow++
            } else {
                const checkinReal = max([r.dataCheckin, monthStart])
                const checkoutReal = min([r.dataCheckout, monthEnd])

                let diasNoMes = differenceInCalendarDays(checkoutReal, checkinReal)

                if (diasNoMes === 0 && r.dataCheckin.getDate() === r.dataCheckout.getDate()) {
                    diasNoMes = 1
                }

                if (diasNoMes > 0) {
                    diasOcupadosNoMes += diasNoMes
                }
            }
        }

        // Taxa de Ocupacao
        const diasTotaisDoMes = differenceInCalendarDays(monthEnd, monthStart) + 1
        const capacidadeMaximaDias = totalAcomodacoes * diasTotaisDoMes

        let taxaOcupacao = 0
        if (capacidadeMaximaDias > 0) {
            taxaOcupacao = (diasOcupadosNoMes / capacidadeMaximaDias) * 100
        }

        const taxaCancelamento = totalReservasMes > 0 ? (reservasCanceladas / totalReservasMes) * 100 : 0
        const taxaNoShow = totalReservasMes > 0 ? (reservasNoShow / totalReservasMes) * 100 : 0

        return {
            taxaOcupacao: taxaOcupacao.toFixed(1),
            taxaCancelamento: taxaCancelamento.toFixed(1),
            taxaNoShow: taxaNoShow.toFixed(1),
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

export async function getAcomodacaoStatusSummary() {
    try {
        const { pousadaId } = await requireAuth()

        const acomodacoes = await prisma.acomodacao.findMany({
            where: { pousadaId },
            select: { status: true }
        })

        const summary: Record<string, number> = {
            DISPONIVEL: 0,
            OCUPADO: 0,
            LIMPEZA: 0,
            MANUTENCAO: 0,
            BLOQUEADO: 0
        }

        for (const a of acomodacoes) {
            summary[a.status] = (summary[a.status] || 0) + 1
        }

        return summary
    } catch (error) {
        console.error("Erro ao puxar status das acomodações:", error)
        return { DISPONIVEL: 0, OCUPADO: 0, LIMPEZA: 0, MANUTENCAO: 0, BLOQUEADO: 0 }
    }
}

export async function getUpcomingCheckins() {
    try {
        const { pousadaId } = await requireAuth()

        const now = new Date()
        const todayStart = startOfDay(now)
        const sevenDaysLater = endOfDay(addDays(now, 7))

        const reservas = await prisma.reserva.findMany({
            where: {
                pousadaId,
                status: 'CONFIRMADA',
                dataCheckin: {
                    gte: todayStart,
                    lte: sevenDaysLater
                }
            },
            include: {
                hospede: { select: { nome: true } },
                acomodacao: { select: { nome: true } }
            },
            orderBy: { dataCheckin: 'asc' },
            take: 8
        })

        return reservas.map(r => ({
            id: r.id,
            hospedeNome: r.hospede.nome,
            acomodacaoNome: r.acomodacao.nome,
            dataCheckin: r.dataCheckin.toISOString(),
            dataCheckout: r.dataCheckout.toISOString(),
            noites: differenceInCalendarDays(r.dataCheckout, r.dataCheckin)
        }))
    } catch (error) {
        console.error("Erro ao puxar próximas chegadas:", error)
        return []
    }
}

export async function getMonthlyFinancial() {
    try {
        const { pousadaId } = await requireAuth()

        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)

        const lancamentos = await prisma.lancamentoFinanceiro.findMany({
            where: {
                pousadaId,
                data: { gte: monthStart, lte: monthEnd }
            },
            select: { tipo: true, valor: true }
        })

        let entradas = 0
        let saidas = 0

        for (const l of lancamentos) {
            const valor = Number(l.valor)
            if (l.tipo === 'ENTRADA') entradas += valor
            else saidas += valor
        }

        return { entradas, saidas, saldo: entradas - saidas }
    } catch (error) {
        console.error("Erro ao puxar financeiro do mês:", error)
        return { entradas: 0, saidas: 0, saldo: 0 }
    }
}

type DashboardAlertsResult = {
    urgentTasks: { id: string; titulo: string; acomodacaoNome: string | null }[]
    pendingReservas: { id: string; hospedeNome: string; acomodacaoNome: string; criadoEm: string }[]
    maintenanceRooms: { id: string; nome: string }[]
    stockAlerts: { id: string; nome: string; estoque: number; zerado: boolean }[]
}

export async function getDashboardAlerts(): Promise<DashboardAlertsResult> {
    try {
        const { pousadaId } = await requireAuth()

        const twoDaysAgo = subDays(new Date(), 2)

        const [urgentTasks, pendingReservas, maintenanceRooms, totalAcomodacoes, lowStockItems] = await Promise.all([
            prisma.tarefa.findMany({
                where: {
                    pousadaId,
                    prioridade: 'URGENTE',
                    status: { in: ['PENDENTE', 'EM_ANDAMENTO'] }
                },
                select: { id: true, titulo: true, acomodacao: { select: { nome: true } } },
                orderBy: { criadoEm: 'asc' },
                take: 5
            }),
            prisma.reserva.findMany({
                where: {
                    pousadaId,
                    status: 'PENDENTE',
                    criadoEm: { lte: twoDaysAgo }
                },
                include: {
                    hospede: { select: { nome: true } },
                    acomodacao: { select: { nome: true } }
                },
                orderBy: { criadoEm: 'asc' },
                take: 5
            }),
            prisma.acomodacao.findMany({
                where: { pousadaId, status: 'MANUTENCAO' },
                select: { id: true, nome: true }
            }),
            prisma.acomodacao.count({ where: { pousadaId } }),
            prisma.produtoServico.findMany({
                where: {
                    pousadaId,
                    ativo: true,
                    estoque: { not: null }
                },
                select: { id: true, nome: true, estoque: true },
                orderBy: { estoque: 'asc' }
            })
        ])

        const limiteEstoque = totalAcomodacoes * 7
        const stockAlerts = lowStockItems
            .filter(p => p.estoque !== null && p.estoque < limiteEstoque)
            .map(p => ({
                id: p.id,
                nome: p.nome,
                estoque: p.estoque as number,
                zerado: p.estoque === 0
            }))

        return {
            urgentTasks: urgentTasks.map(t => ({
                id: t.id,
                titulo: t.titulo,
                acomodacaoNome: t.acomodacao?.nome ?? null
            })),
            pendingReservas: pendingReservas.map(r => ({
                id: r.id,
                hospedeNome: r.hospede.nome,
                acomodacaoNome: r.acomodacao.nome,
                criadoEm: r.criadoEm.toISOString()
            })),
            maintenanceRooms: maintenanceRooms.map(a => ({
                id: a.id,
                nome: a.nome
            })),
            stockAlerts
        }
    } catch (error) {
        console.error("Erro ao puxar alertas do dashboard:", error)
        return { urgentTasks: [], pendingReservas: [], maintenanceRooms: [], stockAlerts: [] }
    }
}
