'use server'

import prisma from '@/lib/prisma'
import { eachMonthOfInterval, eachDayOfInterval, format, differenceInDays, differenceInMinutes, subDays, getDaysInMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { requireAuth } from '@/lib/auth'

export async function getDashboardIndicators(params?: { startDate?: string; endDate?: string }) {
    try {
        const { pousadaId } = await requireAuth()

        const now = new Date()

        // Default: últimos 30 dias
        const rangeEnd = params?.endDate
            ? new Date(params.endDate + 'T23:59:59')
            : now
        const rangeStart = params?.startDate
            ? new Date(params.startDate + 'T00:00:00')
            : subDays(now, 29)

        const rangeDays = Math.max(1, differenceInDays(rangeEnd, rangeStart) + 1)
        const useDaily = rangeDays <= 90

        const totalAcomodacoes = await prisma.acomodacao.count({
            where: { pousadaId }
        })

        // Reservas ativas no período (filtradas por check-in)
        const reservasAtivas = await prisma.reserva.findMany({
            where: {
                pousadaId,
                status: { not: 'CANCELADA' },
                dataCheckin: { gte: rangeStart, lte: rangeEnd }
            },
            select: {
                valorTotal: true,
                dataCheckin: true,
                dataCheckout: true,
                criadoEm: true,
                totalHospedes: true,
                hospedeId: true,
                hospede: { select: { cidade: true } }
            }
        })

        // Todas as reservas do período (para taxa de cancelamento)
        const todasReservas = await prisma.reserva.findMany({
            where: {
                pousadaId,
                dataCheckin: { gte: rangeStart, lte: rangeEnd }
            },
            select: { status: true, dataCheckin: true }
        })

        // 1. Taxa de Cancelamento
        const totalHistorico = todasReservas.length
        const totalCanceladas = todasReservas.filter(r => r.status === 'CANCELADA').length
        const totalNoShows = todasReservas.filter(r => r.status === 'NO_SHOW').length
        const cancelationRate = totalHistorico > 0 ? ((totalCanceladas / totalHistorico) * 100).toFixed(1) : '0.0'
        const taxaNoShow = totalHistorico > 0 ? ((totalNoShows / totalHistorico) * 100).toFixed(1) : '0.0'

        // Per-bucket cancel/noshow para sparklines
        const cancelBucketMap = new Map<string, number>()
        const noShowBucketMap = new Map<string, number>()
        const totalBucketMap = new Map<string, number>()
        todasReservas.forEach(r => {
            const bKey = useDaily
                ? format(r.dataCheckin, 'dd/MM')
                : format(r.dataCheckin, 'MMM', { locale: ptBR })
            totalBucketMap.set(bKey, (totalBucketMap.get(bKey) || 0) + 1)
            if (r.status === 'CANCELADA') cancelBucketMap.set(bKey, (cancelBucketMap.get(bKey) || 0) + 1)
            if (r.status === 'NO_SHOW') noShowBucketMap.set(bKey, (noShowBucketMap.get(bKey) || 0) + 1)
        })

        // Hóspedes únicos no período
        const hospedeIds = Array.from(new Set(reservasAtivas.map(r => r.hospedeId)))
        const totalHospedes = hospedeIds.length

        // 2-4. ADR, Lead Time, Receita + KPIs adicionais
        let totalReceita = 0
        let totalDiariasVendidas = 0
        let sumLeadTime = 0
        let countReservasComLead = 0
        let sumLOS = 0
        let countLOS = 0
        let sumHospedes = 0
        const cidadeCountMap = new Map<string, number>()

        const monthlyRevenueMap = new Map<string, number>()
        const monthlyBookingsMap = new Map<string, number>()
        const monthlyNightsMap = new Map<string, number>()
        const dailyRevenueMap = new Map<string, number>()
        const dailyBookingsMap = new Map<string, number>()
        const dailyNightsMap = new Map<string, number>()
        const ltvMap = new Map<string, number>()
        const bucketLeadSumMap = new Map<string, number>()
        const bucketLeadCountMap = new Map<string, number>()
        const bucketLOSSumMap = new Map<string, number>()
        const bucketLOSCountMap = new Map<string, number>()
        const bucketPaxSumMap = new Map<string, number>()
        const bucketPaxCountMap = new Map<string, number>()

        reservasAtivas.forEach(r => {
            const diarias = differenceInDays(r.dataCheckout, r.dataCheckin) || 1
            const valor = Number(r.valorTotal)

            totalReceita += valor
            totalDiariasVendidas += diarias
            ltvMap.set(r.hospedeId, (ltvMap.get(r.hospedeId) || 0) + valor)

            const lead = differenceInDays(r.dataCheckin, r.criadoEm)
            if (lead >= 0) {
                sumLeadTime += lead
                countReservasComLead++
            }

            const los = differenceInDays(r.dataCheckout, r.dataCheckin)
            if (los > 0) { sumLOS += los; countLOS++ }

            sumHospedes += r.totalHospedes

            const cidade = r.hospede?.cidade?.trim()
            if (cidade) cidadeCountMap.set(cidade, (cidadeCountMap.get(cidade) || 0) + 1)

            const monthKey = format(r.dataCheckin, 'MMM', { locale: ptBR })
            monthlyRevenueMap.set(monthKey, (monthlyRevenueMap.get(monthKey) || 0) + valor)
            monthlyBookingsMap.set(monthKey, (monthlyBookingsMap.get(monthKey) || 0) + 1)

            const dayKey = format(r.dataCheckin, 'dd/MM')
            dailyRevenueMap.set(dayKey, (dailyRevenueMap.get(dayKey) || 0) + valor)
            dailyBookingsMap.set(dayKey, (dailyBookingsMap.get(dayKey) || 0) + 1)
            dailyNightsMap.set(dayKey, (dailyNightsMap.get(dayKey) || 0) + diarias)
            monthlyNightsMap.set(monthKey, (monthlyNightsMap.get(monthKey) || 0) + diarias)

            const bucketKey = useDaily ? dayKey : monthKey
            if (lead >= 0) {
                bucketLeadSumMap.set(bucketKey, (bucketLeadSumMap.get(bucketKey) || 0) + lead)
                bucketLeadCountMap.set(bucketKey, (bucketLeadCountMap.get(bucketKey) || 0) + 1)
            }
            if (los > 0) {
                bucketLOSSumMap.set(bucketKey, (bucketLOSSumMap.get(bucketKey) || 0) + los)
                bucketLOSCountMap.set(bucketKey, (bucketLOSCountMap.get(bucketKey) || 0) + 1)
            }
            bucketPaxSumMap.set(bucketKey, (bucketPaxSumMap.get(bucketKey) || 0) + r.totalHospedes)
            bucketPaxCountMap.set(bucketKey, (bucketPaxCountMap.get(bucketKey) || 0) + 1)
        })

        const tempoMedioEstadia = countLOS > 0 ? sumLOS / countLOS : 0
        const mediaHospedesPorEstadia = reservasAtivas.length > 0 ? sumHospedes / reservasAtivas.length : 0

        const principaisCidades = Array.from(cidadeCountMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cidade, count]) => ({ cidade, count }))

        const adr = totalDiariasVendidas > 0 ? (totalReceita / totalDiariasVendidas) : 0
        const leadTimeAvg = countReservasComLead > 0 ? (sumLeadTime / countReservasComLead) : 0

        // RevPAR e Taxa de Ocupação baseados na capacidade do período selecionado
        const capacidadeTotalPeriodo = totalAcomodacoes * rangeDays
        const revpar = capacidadeTotalPeriodo > 0 ? (totalReceita / capacidadeTotalPeriodo) : 0
        const taxaOcupacao = capacidadeTotalPeriodo > 0
            ? ((totalDiariasVendidas / capacidadeTotalPeriodo) * 100).toFixed(1)
            : '0.0'

        // Médias temporais proporcionais ao período
        const mesesNoPeriodo = Math.max(1, Math.ceil(rangeDays / 30))
        const semanasNoPeriodo = Math.max(1, Math.ceil(rangeDays / 7))

        const mediaFaturamentoMensal = totalReceita / mesesNoPeriodo
        const mediaFaturamentoSemanal = totalReceita / semanasNoPeriodo

        // Extras do período
        const extras = await prisma.extraReserva.findMany({
            where: {
                reserva: { pousadaId, status: { not: 'CANCELADA' } },
                criadoEm: { gte: rangeStart, lte: rangeEnd }
            },
            include: {
                reserva: { select: { hospedeId: true } },
                produto: { select: { categoria: true } }
            }
        })

        let totalReceitaExtras = 0
        const itemConsumoCountMap = new Map<string, number>()
        const dailyExtrasRevMap = new Map<string, number>()
        const monthlyExtrasRevMap = new Map<string, number>()
        const produtoConsumoQtyMap = new Map<string, number>()
        const servicoConsumoQtyMap = new Map<string, number>()
        const categoriaReceitaMap = new Map<string, number>()
        const reservasComConsumoSet = new Set<string>()
        let totalItensConsumo = 0
        const CATEGORIAS_PRODUTO = ['FRIGOBAR', 'RESTAURANTE', 'OUTRO']
        const CATEGORIAS_SERVICO = ['SERVICO', 'PASSEIO']

        extras.forEach(ext => {
            const valTotalExtra = Number(ext.valor) * ext.quantidade
            totalReceitaExtras += valTotalExtra
            itemConsumoCountMap.set(ext.descricao, (itemConsumoCountMap.get(ext.descricao) || 0) + ext.quantidade)
            const hId = ext.reserva.hospedeId
            ltvMap.set(hId, (ltvMap.get(hId) || 0) + valTotalExtra)

            const extDayKey = format(ext.criadoEm, 'dd/MM')
            const extMonthKey = format(ext.criadoEm, 'MMM', { locale: ptBR })
            dailyExtrasRevMap.set(extDayKey, (dailyExtrasRevMap.get(extDayKey) || 0) + valTotalExtra)
            monthlyExtrasRevMap.set(extMonthKey, (monthlyExtrasRevMap.get(extMonthKey) || 0) + valTotalExtra)

            reservasComConsumoSet.add(ext.reservaId)
            totalItensConsumo += ext.quantidade

            const cat = ext.produto?.categoria as string | undefined
            if (cat) {
                categoriaReceitaMap.set(cat, (categoriaReceitaMap.get(cat) || 0) + valTotalExtra)
                if (CATEGORIAS_PRODUTO.includes(cat)) {
                    produtoConsumoQtyMap.set(ext.descricao, (produtoConsumoQtyMap.get(ext.descricao) || 0) + ext.quantidade)
                } else if (CATEGORIAS_SERVICO.includes(cat)) {
                    servicoConsumoQtyMap.set(ext.descricao, (servicoConsumoQtyMap.get(ext.descricao) || 0) + ext.quantidade)
                }
            }
        })

        const receitaMediaMensalConsumo = totalReceitaExtras / mesesNoPeriodo
        const receitaExtraPorHospedagem = reservasAtivas.length > 0 ? (totalReceitaExtras / reservasAtivas.length) : 0

        // Taxa de retorno: hóspedes do período que têm mais de uma reserva concluída (histórico total)
        const hospedesRetornantes = totalHospedes > 0
            ? await prisma.reserva.groupBy({
                by: ['hospedeId'],
                where: { hospedeId: { in: hospedeIds }, pousadaId, status: { not: 'CANCELADA' } },
                _count: { id: true },
                having: { id: { _count: { gt: 1 } } }
            })
            : []
        const taxaRetorno = totalHospedes > 0
            ? ((hospedesRetornantes.length / totalHospedes) * 100).toFixed(1)
            : '0.0'

        const uniqueGuests = ltvMap.size
        const ltvMedio = uniqueGuests > 0
            ? Array.from(ltvMap.values()).reduce((a, b) => a + b, 0) / uniqueGuests
            : 0
        const ticketMedio = reservasAtivas.length > 0
            ? (totalReceita + totalReceitaExtras) / reservasAtivas.length
            : 0

        let itemMaisConsumido = "N/D"
        let maxConsumo = 0
        itemConsumoCountMap.forEach((qty, name) => {
            if (qty > maxConsumo) { maxConsumo = qty; itemMaisConsumido = name }
        })

        // Métricas expandidas de consumo
        const reservasComConsumo = reservasComConsumoSet.size
        const taxaConsumo = reservasAtivas.length > 0
            ? ((reservasComConsumo / reservasAtivas.length) * 100).toFixed(1)
            : '0.0'
        const mediaItensConsumo = reservasComConsumo > 0
            ? (totalItensConsumo / reservasComConsumo).toFixed(1)
            : '0.0'
        const ticketConsumo = reservasComConsumo > 0
            ? (totalReceitaExtras / reservasComConsumo).toFixed(2)
            : '0.00'

        const extremoConsumo = (map: Map<string, number>) => {
            if (map.size === 0) return { mais: 'N/D', menos: 'N/D' }
            const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
            return { mais: entries[0][0], menos: entries[entries.length - 1][0] }
        }
        const { mais: produtoMaisConsumido, menos: produtoMenosConsumido } = extremoConsumo(produtoConsumoQtyMap)
        const { mais: servicoMaisConsumido, menos: servicoMenosConsumido } = extremoConsumo(servicoConsumoQtyMap)

        const LABEL_CATEGORIA: Record<string, string> = {
            FRIGOBAR: 'Frigobar', RESTAURANTE: 'Restaurante', PASSEIO: 'Passeio',
            SERVICO: 'Serviço', OUTRO: 'Outro'
        }
        let categoriaMaisLucrativa = 'N/D'
        let maxCatReceita = 0
        categoriaReceitaMap.forEach((v, k) => {
            if (v > maxCatReceita) { maxCatReceita = v; categoriaMaisLucrativa = LABEL_CATEGORIA[k] ?? k }
        })

        const catalogoPorCategoria = await prisma.produtoServico.groupBy({
            by: ['categoria'],
            where: { pousadaId, ativo: true },
            _count: { id: true }
        })
        const totalProdutosCatalogo = catalogoPorCategoria
            .filter(g => CATEGORIAS_PRODUTO.includes(g.categoria as string))
            .reduce((s, g) => s + g._count.id, 0)
        const totalServicosCatalogo = catalogoPorCategoria
            .filter(g => CATEGORIAS_SERVICO.includes(g.categoria as string))
            .reduce((s, g) => s + g._count.id, 0)

        // Tempo médio de limpeza no período
        const tarefasLimpeza = await prisma.tarefa.findMany({
            where: {
                pousadaId,
                tipo: 'LIMPEZA',
                status: 'CONCLUIDA',
                concluidaEm: { gte: rangeStart, lte: rangeEnd }
            },
            select: { tempoGastoMinutos: true, iniciadaEm: true, concluidaEm: true }
        })

        let sumTempoLimpeza = 0
        let countLimpeza = 0
        const bucketLimpezaSumMap = new Map<string, number>()
        const bucketLimpezaCountMap = new Map<string, number>()
        tarefasLimpeza.forEach(t => {
            let min = 0
            if (t.tempoGastoMinutos !== null && t.tempoGastoMinutos > 0) {
                min = t.tempoGastoMinutos
            } else if (t.iniciadaEm && t.concluidaEm) {
                min = differenceInMinutes(t.concluidaEm, t.iniciadaEm)
            }
            if (min > 0) {
                sumTempoLimpeza += min
                countLimpeza++
                if (t.concluidaEm) {
                    const bKey = useDaily
                        ? format(t.concluidaEm, 'dd/MM')
                        : format(t.concluidaEm, 'MMM', { locale: ptBR })
                    bucketLimpezaSumMap.set(bKey, (bucketLimpezaSumMap.get(bKey) || 0) + min)
                    bucketLimpezaCountMap.set(bKey, (bucketLimpezaCountMap.get(bKey) || 0) + 1)
                }
            }
        })
        const tempoMedioLimpezaMin = countLimpeza > 0 ? Math.round(sumTempoLimpeza / countLimpeza) : null

        // Custos operacionais no período (agrupados por categoria)
        const custosOperacionais = await prisma.lancamentoFinanceiro.groupBy({
            by: ['categoria'],
            where: {
                pousadaId,
                tipo: 'SAIDA',
                categoria: { in: ['MANUTENCAO', 'AGUA', 'ENERGIA', 'MARKETING', 'IMPOSTOS', 'COMISSOES'] },
                data: { gte: rangeStart, lte: rangeEnd }
            },
            _sum: { valor: true }
        })

        const getCusto = (cat: string) =>
            Number(custosOperacionais.find(c => c.categoria === cat)?._sum?.valor || 0)

        const totalCustoManutencao = getCusto('MANUTENCAO')
        const totalCustoAgua       = getCusto('AGUA')
        const totalCustoEnergia    = getCusto('ENERGIA')
        const totalCustoMarketing  = getCusto('MARKETING')
        const totalCustoImpostos   = getCusto('IMPOSTOS')
        const totalCustoComissoes  = getCusto('COMISSOES')

        const custoMedioMensalManutencao = totalCustoManutencao / mesesNoPeriodo
        const custoMedioMensalAgua       = totalCustoAgua       / mesesNoPeriodo
        const custoMedioMensalEnergia    = totalCustoEnergia    / mesesNoPeriodo
        const custoMedioMensalMarketing  = totalCustoMarketing  / mesesNoPeriodo
        const custoMedioMensalImpostos   = totalCustoImpostos   / mesesNoPeriodo
        const custoMedioMensalComissoes  = totalCustoComissoes  / mesesNoPeriodo

        // Séries temporais dos custos operacionais (para sparklines)
        const lancamentosCustosSeries = await prisma.lancamentoFinanceiro.findMany({
            where: {
                pousadaId,
                tipo: 'SAIDA',
                categoria: { in: ['MANUTENCAO', 'AGUA', 'ENERGIA', 'MARKETING', 'IMPOSTOS', 'COMISSOES'] },
                data: { gte: rangeStart, lte: rangeEnd }
            },
            select: { categoria: true, valor: true, data: true }
        })

        const costBuckets: Record<string, Map<string, number>> = {
            MANUTENCAO: new Map(), AGUA: new Map(), ENERGIA: new Map(),
            MARKETING: new Map(), IMPOSTOS: new Map(), COMISSOES: new Map()
        }
        lancamentosCustosSeries.forEach(l => {
            const bucket = costBuckets[l.categoria as string]
            if (!bucket) return
            const key = useDaily
                ? format(l.data, 'dd/MM')
                : format(l.data, 'MMM', { locale: ptBR })
            bucket.set(key, (bucket.get(key) || 0) + Number(l.valor))
        })

        const buildCostSeries = (bucket: Map<string, number>) => {
            if (useDaily) {
                return eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map(d => ({
                    t: format(d, 'dd/MM'), v: bucket.get(format(d, 'dd/MM')) || 0
                }))
            }
            return eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map(m => ({
                t: format(m, 'MMM', { locale: ptBR }), v: bucket.get(format(m, 'MMM', { locale: ptBR })) || 0
            }))
        }

        const custosSeries = {
            manutencao: buildCostSeries(costBuckets.MANUTENCAO),
            agua:       buildCostSeries(costBuckets.AGUA),
            energia:    buildCostSeries(costBuckets.ENERGIA),
            marketing:  buildCostSeries(costBuckets.MARKETING),
            impostos:   buildCostSeries(costBuckets.IMPOSTOS),
            comissoes:  buildCostSeries(costBuckets.COMISSOES),
        }

        // Gráficos: diário (≤31 dias) ou mensal (>31 dias)
        let revenueChartData: { month: string; receita: number }[]
        let bookingsPerMonthData: { month: string; _count: number }[]

        if (useDaily) {
            const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
            revenueChartData = days.map(d => {
                const key = format(d, 'dd/MM')
                return { month: key, receita: dailyRevenueMap.get(key) || 0 }
            })
            bookingsPerMonthData = days.map(d => {
                const key = format(d, 'dd/MM')
                return { month: key, _count: dailyBookingsMap.get(key) || 0 }
            })
        } else {
            const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd })
            revenueChartData = months.map(m => {
                const key = format(m, 'MMM', { locale: ptBR })
                return { month: key, receita: monthlyRevenueMap.get(key) || 0 }
            })
            bookingsPerMonthData = months.map(m => {
                const key = format(m, 'MMM', { locale: ptBR })
                return { month: key, _count: monthlyBookingsMap.get(key) || 0 }
            })
        }

        const statusChartData = [
            { id: "confirmadas", status: "Efetivadas", _count: totalHistorico - totalCanceladas, fill: "var(--color-efetivadas)" },
            { id: "canceladas", status: "Canceladas", _count: totalCanceladas, fill: "var(--color-canceladas)" }
        ]

        // Séries temporais dos KPIs financeiros (para sparklines)
        const revMap     = useDaily ? dailyRevenueMap   : monthlyRevenueMap
        const nightsMap  = useDaily ? dailyNightsMap    : monthlyNightsMap
        const bookMap    = useDaily ? dailyBookingsMap  : monthlyBookingsMap
        const extRevMap  = useDaily ? dailyExtrasRevMap : monthlyExtrasRevMap

        const buildFinancialSeries = (fn: (key: string, date: Date) => number) => {
            if (useDaily) {
                return eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map(d => ({
                    t: format(d, 'dd/MM'), v: fn(format(d, 'dd/MM'), d)
                }))
            }
            return eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map(m => ({
                t: format(m, 'MMM', { locale: ptBR }), v: fn(format(m, 'MMM', { locale: ptBR }), m)
            }))
        }

        const hospedagemSeries = {
            ocupacao: buildFinancialSeries((key, d) => {
                const cap = totalAcomodacoes * (useDaily ? 1 : getDaysInMonth(d))
                return cap > 0 ? parseFloat(((nightsMap.get(key) || 0) / cap * 100).toFixed(2)) : 0
            }),
            reservas: buildFinancialSeries((key) => bookMap.get(key) || 0),
            leadTime: buildFinancialSeries((key) => {
                const s = bucketLeadSumMap.get(key) || 0
                const c = bucketLeadCountMap.get(key) || 0
                return c > 0 ? parseFloat((s / c).toFixed(1)) : 0
            }),
            los: buildFinancialSeries((key) => {
                const s = bucketLOSSumMap.get(key) || 0
                const c = bucketLOSCountMap.get(key) || 0
                return c > 0 ? parseFloat((s / c).toFixed(1)) : 0
            }),
            pax: buildFinancialSeries((key) => {
                const s = bucketPaxSumMap.get(key) || 0
                const c = bucketPaxCountMap.get(key) || 0
                return c > 0 ? parseFloat((s / c).toFixed(1)) : 0
            }),
            cancelRate: buildFinancialSeries((key) => {
                const total = totalBucketMap.get(key) || 0
                const cancel = cancelBucketMap.get(key) || 0
                return total > 0 ? parseFloat((cancel / total * 100).toFixed(1)) : 0
            }),
            noShowRate: buildFinancialSeries((key) => {
                const total = totalBucketMap.get(key) || 0
                const ns = noShowBucketMap.get(key) || 0
                return total > 0 ? parseFloat((ns / total * 100).toFixed(1)) : 0
            }),
            limpeza: buildFinancialSeries((key) => {
                const s = bucketLimpezaSumMap.get(key) || 0
                const c = bucketLimpezaCountMap.get(key) || 0
                return c > 0 ? parseFloat((s / c).toFixed(1)) : 0
            }),
        }

        const financialSeries = {
            adr: buildFinancialSeries((key) => {
                const nights = nightsMap.get(key) || 0
                return nights > 0 ? parseFloat(((revMap.get(key) || 0) / nights).toFixed(2)) : 0
            }),
            revpar: buildFinancialSeries((key, d) => {
                const cap = totalAcomodacoes * (useDaily ? 1 : getDaysInMonth(d))
                return cap > 0 ? parseFloat(((revMap.get(key) || 0) / cap).toFixed(2)) : 0
            }),
            ticket: buildFinancialSeries((key) => {
                const bookings = bookMap.get(key) || 0
                const total = (revMap.get(key) || 0) + (extRevMap.get(key) || 0)
                return bookings > 0 ? parseFloat((total / bookings).toFixed(2)) : 0
            }),
            receita: buildFinancialSeries((key) => revMap.get(key) || 0),
            extras: buildFinancialSeries((key) => extRevMap.get(key) || 0),
            extrasPerBooking: buildFinancialSeries((key) => {
                const bookings = bookMap.get(key) || 0
                const extras = extRevMap.get(key) || 0
                return bookings > 0 ? parseFloat((extras / bookings).toFixed(2)) : 0
            }),
        }

        return {
            adr: adr.toFixed(2),
            revpar: revpar.toFixed(2),
            taxaOcupacao,
            leadTime: leadTimeAvg.toFixed(1),
            cancelationRate,
            tempoMedioEstadia: tempoMedioEstadia.toFixed(1),
            mediaHospedesPorEstadia: mediaHospedesPorEstadia.toFixed(1),
            principaisCidades,
            tempoMedioLimpezaMin,
            mediaFaturamentoMensal: mediaFaturamentoMensal.toFixed(2),
            mediaFaturamentoSemanal: mediaFaturamentoSemanal.toFixed(2),
            receitaMediaMensalConsumo: receitaMediaMensalConsumo.toFixed(2),
            receitaExtraPorHospedagem: receitaExtraPorHospedagem.toFixed(2),
            ltvMedio: ltvMedio.toFixed(2),
            ticketMedio: ticketMedio.toFixed(2),
            totalHospedes,
            taxaRetorno,
            taxaNoShow,
            totalNoShows,
            itemMaisConsumido,
            produtoMaisConsumido,
            produtoMenosConsumido,
            servicoMaisConsumido,
            servicoMenosConsumido,
            taxaConsumo,
            reservasComConsumo,
            mediaItensConsumo,
            ticketConsumo,
            categoriaMaisLucrativa,
            totalProdutosCatalogo,
            totalServicosCatalogo,
            custoMedioMensalManutencao: custoMedioMensalManutencao.toFixed(2),
            custoMedioMensalAgua:       custoMedioMensalAgua.toFixed(2),
            custoMedioMensalEnergia:    custoMedioMensalEnergia.toFixed(2),
            custoMedioMensalMarketing:  custoMedioMensalMarketing.toFixed(2),
            custoMedioMensalImpostos:   custoMedioMensalImpostos.toFixed(2),
            custoMedioMensalComissoes:  custoMedioMensalComissoes.toFixed(2),
            custosSeries,
            financialSeries,
            hospedagemSeries,
            revenueChartData,
            statusChartData,
            bookingsPerMonthData,
            totalReceitaAno: totalReceita.toFixed(2)
        }

    } catch (error: any) {
        console.error("Erro ao gerar indicadores", error)
        return { _globalError: error.message || String(error) } as any
    }
}
