'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { startOfYear, endOfYear, eachMonthOfInterval, format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

async function requireAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Não autenticado')
    }

    const usuario = await prisma.usuario.findUnique({
        where: { supabaseId: user.id },
        select: { pousadaId: true }
    })

    if (!usuario) {
        throw new Error('Usuário não vinculado a uma pousada')
    }

    return { user, pousadaId: usuario.pousadaId }
}

export async function getDashboardIndicators() {
    try {
        const { pousadaId } = await requireAuth()

        const now = new Date()
        const yearStart = startOfYear(now)
        const yearEnd = endOfYear(now)

        const totalAcomodacoes = await prisma.acomodacao.count({
            where: { pousadaId }
        })

        // Buscar todas as reservas (ativas) para os cálculos de ADR/RevPAR
        const reservasAtivas = await prisma.reserva.findMany({
            where: {
                pousadaId,
                status: { not: 'CANCELADA' }
            },
            select: {
                valorTotal: true,
                dataCheckin: true,
                dataCheckout: true,
                criadoEm: true
            }
        })

        // Buscar TODAS as reservas (incluindo canceladas) para a Taxa de Cancelamento
        const todasReservas = await prisma.reserva.findMany({
            where: { pousadaId },
            select: { status: true }
        })

        // 1. Taxa de Cancelamento (do histórico geral)
        const totalHistorico = todasReservas.length

        const totalCanceladas = todasReservas.filter(r => r.status === 'CANCELADA').length
        const cancelationRate = totalHistorico > 0 ? ((totalCanceladas / totalHistorico) * 100).toFixed(1) : '0.0'

        // 2, 3 e 4. ADR, Lead Time e Receita Acumulada
        let totalReceita = 0
        let totalDiariasVendidas = 0
        let sumLeadTime = 0
        let countReservasComLead = 0

        const monthlyRevenueMap = new Map<string, number>()

        reservasAtivas.forEach(r => {
            const diarias = differenceInDays(r.dataCheckout, r.dataCheckin) || 1
            const valor = Number(r.valorTotal)

            totalReceita += valor
            totalDiariasVendidas += diarias

            // Lead time
            const lead = differenceInDays(r.dataCheckin, r.criadoEm)
            if (lead >= 0) {
                sumLeadTime += lead
                countReservasComLead++
            }

            // Agrega Receita por mês do Check-in (para faturamento do ano)
            const monthKey = format(r.dataCheckin, 'MMM', { locale: ptBR })
            monthlyRevenueMap.set(monthKey, (monthlyRevenueMap.get(monthKey) || 0) + valor)
        })

        const adr = totalDiariasVendidas > 0 ? (totalReceita / totalDiariasVendidas) : 0
        const leadTimeAvg = countReservasComLead > 0 ? (sumLeadTime / countReservasComLead) : 0

        // 5. RevPAR
        const diasNoAno = differenceInDays(now, yearStart) + 1
        const capacidadeTotalAteAgora = totalAcomodacoes * diasNoAno
        const revpar = capacidadeTotalAteAgora > 0 ? (totalReceita / capacidadeTotalAteAgora) : 0

        // -------------------------------------------------------------
        // NOVAS MÉTRICAS DE CONSUMO E MANUTENÇÃO (6 a 10)
        // -------------------------------------------------------------

        // Faturamento Fixo e Temporal
        const mesesDecorridosAnoAtual = Math.max(1, new Date().getMonth() + 1)
        const semanasDecorridasAnoAtual = Math.max(1, Math.ceil(diasNoAno / 7))

        const mediaFaturamentoMensal = totalReceita / mesesDecorridosAnoAtual
        const mediaFaturamentoSemanal = totalReceita / semanasDecorridasAnoAtual

        // Busca de Extras de Reservas Ativas do ano para Ticket Médio de Consumo
        const extrasAno = await prisma.extraReserva.findMany({
            where: {
                reserva: { pousadaId, status: { not: 'CANCELADA' } },
                criadoEm: { gte: yearStart }
            }
        })

        let totalReceitaExtras = 0
        const itemConsumoCountMap = new Map<string, number>()

        extrasAno.forEach(ext => {
            const valTotalExtra = Number(ext.valor) * ext.quantidade
            totalReceitaExtras += valTotalExtra

            // Frequencia para o 'Item Mais Consumido'
            itemConsumoCountMap.set(ext.descricao, (itemConsumoCountMap.get(ext.descricao) || 0) + ext.quantidade)
        })

        const receitaMediaMensalConsumo = totalReceitaExtras / mesesDecorridosAnoAtual
        const receitaExtraPorHospedagem = reservasAtivas.length > 0 ? (totalReceitaExtras / reservasAtivas.length) : 0

        let itemMaisConsumido = "N/D"
        let maxConsumo = 0
        itemConsumoCountMap.forEach((qty, name) => {
            if (qty > maxConsumo) {
                maxConsumo = qty
                itemMaisConsumido = name
            }
        })

        // Busca de Saídas de Caixa marcadas como MANUTENCAO no ano
        const custosManutencaoAno = await prisma.lancamentoFinanceiro.aggregate({
            _sum: { valor: true },
            where: {
                pousadaId,
                tipo: 'SAIDA',
                categoria: 'MANUTENCAO',
                data: { gte: yearStart }
            }
        })

        const totalCustoManutencao = Number(custosManutencaoAno._sum?.valor || 0)
        const custoMedioMensalManutencao = totalCustoManutencao / mesesDecorridosAnoAtual

        // Geração do Dataset do Gráfico de Receita Mês a Mês (YTD)
        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })
        const revenueChartData = months.map(m => {
            const monthLabel = format(m, 'MMM', { locale: ptBR })
            return {
                month: monthLabel,
                receita: monthlyRevenueMap.get(monthLabel) || 0
            }
        })

        // 6. Dados Secundários (Gráfico Status Geral e Desempenho Mensal)
        const statusChartData = [
            { id: "confirmadas", status: "Efetivadas", _count: totalHistorico - totalCanceladas, fill: "var(--color-efetivadas)" },
            { id: "canceladas", status: "Canceladas", _count: totalCanceladas, fill: "var(--color-canceladas)" }
        ]

        const reservasAtivasCountMap = new Map<string, number>()
        reservasAtivas.forEach(r => {
            const mKey = format(r.dataCheckin, 'MMM', { locale: ptBR })
            reservasAtivasCountMap.set(mKey, (reservasAtivasCountMap.get(mKey) || 0) + 1)
        })

        const bookingsPerMonthData = months.map(m => {
            const monthLabel = format(m, 'MMM', { locale: ptBR })
            return {
                month: monthLabel,
                _count: reservasAtivasCountMap.get(monthLabel) || 0
            }
        })

        return {
            adr: adr.toFixed(2),
            revpar: revpar.toFixed(2),
            leadTime: leadTimeAvg.toFixed(1),
            cancelationRate,
            mediaFaturamentoMensal: mediaFaturamentoMensal.toFixed(2),
            mediaFaturamentoSemanal: mediaFaturamentoSemanal.toFixed(2),
            receitaMediaMensalConsumo: receitaMediaMensalConsumo.toFixed(2),
            receitaExtraPorHospedagem: receitaExtraPorHospedagem.toFixed(2),
            itemMaisConsumido,
            custoMedioMensalManutencao: custoMedioMensalManutencao.toFixed(2),
            revenueChartData,
            statusChartData,
            bookingsPerMonthData,
            totalReceitaAno: Array.from(monthlyRevenueMap.values()).reduce((a, b) => a + b, 0).toFixed(2)
        }

    } catch (error: any) {
        console.error("Erro ao gerar indicadores", error)
        return { _globalError: error.message || String(error) } as any
    }
}
