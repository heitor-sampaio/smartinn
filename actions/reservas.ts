'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { broadcastPousadaChange } from '@/lib/broadcast'
import { enviarFnrh } from '@/actions/fnrh'

export async function getReservas() {
    try {
        const { pousadaId } = await requireAuth()

        const reservas = await prisma.reserva.findMany({
            where: { pousadaId },
            include: {
                hospede: { select: { nome: true, telefone: true, cpf: true } },
                acomodacao: { select: { nome: true, tipo: true } },
                extras: { orderBy: { criadoEm: 'desc' } }
            },
            orderBy: { dataCheckin: 'asc' }
        })

        // Hack para serializar Decimals do Prisma e Datas (Date -> ISO String) para o Client Component sem erro no Next.js
        const serialized = reservas.map(reserva => ({
            ...reserva,
            dataCheckin: reserva.dataCheckin.toISOString(),
            dataCheckout: reserva.dataCheckout.toISOString(),
            criadoEm: reserva.criadoEm.toISOString(),
            atualizadoEm: reserva.atualizadoEm.toISOString(),
            checkinRealizadoEm: reserva.checkinRealizadoEm ? reserva.checkinRealizadoEm.toISOString() : null,
            checkoutRealizadoEm: reserva.checkoutRealizadoEm ? reserva.checkoutRealizadoEm.toISOString() : null,
            fnrhEnviadoEm: reserva.fnrhEnviadoEm ? reserva.fnrhEnviadoEm.toISOString() : null,
            valorTotal: Number(reserva.valorTotal),
            extras: reserva.extras.map(e => ({
                ...e,
                valor: Number(e.valor),
                criadoEm: e.criadoEm.toISOString()
            }))
        }))

        return { data: serialized }
    } catch (error) {
        console.error("GET RESERVAS ERROR:", error)
        return { error: 'Falha ao buscar a lista de reservas' }
    }
}

export async function getHospedesList() {
    try {
        const { pousadaId } = await requireAuth()
        const hospedes = await prisma.hospede.findMany({
            where: { pousadaId },
            select: { id: true, nome: true, cpf: true },
            orderBy: { nome: 'asc' }
        })
        return { data: hospedes }
    } catch (err) { return { error: 'Falha ao buscar hóspedes' } }
}

export async function getAcomodacoesList() {
    try {
        const { pousadaId } = await requireAuth()
        const acomodacoes = await prisma.acomodacao.findMany({
            where: { pousadaId },
            select: { id: true, nome: true, capacidade: true, tipo: true, valorDiaria: true },
            orderBy: { nome: 'asc' }
        })

        // Serializa o Decimal para Number pra passar pro Client Component sem erro.
        const serialized = acomodacoes.map(a => ({
            ...a,
            valorDiaria: a.valorDiaria ? Number(a.valorDiaria) : 0
        }))

        return { data: serialized }
    } catch (err) { return { error: 'Falha ao buscar acomodações' } }
}

export async function getAcomodacoesDisponiveis(checkinRaw: string, checkoutRaw: string) {
    try {
        const { pousadaId } = await requireAuth()

        if (!checkinRaw || !checkoutRaw) {
            return { data: [] }
        }

        const dataCheckin = new Date(checkinRaw)
        const dataCheckout = new Date(checkoutRaw)

        dataCheckin.setUTCHours(14, 0, 0, 0)
        dataCheckout.setUTCHours(10, 0, 0, 0)

        // Pega todos os IDs de acomodações INcompatíveis no período
        const conflitos = await prisma.reserva.findMany({
            where: {
                pousadaId,
                status: { not: 'CANCELADA' },
                AND: [
                    { dataCheckin: { lt: dataCheckout } },
                    { dataCheckout: { gt: dataCheckin } }
                ]
            },
            select: { acomodacaoId: true }
        })

        const blockedIds = conflitos.map(c => c.acomodacaoId)

        // Busca todas as acomodações que NÃO estão na lista de IDs bloqueados
        const disponiveis = await prisma.acomodacao.findMany({
            where: {
                pousadaId,
                id: { notIn: blockedIds }
            },
            select: { id: true, nome: true, capacidade: true, tipo: true, valorDiaria: true, caracteristicas: true },
            orderBy: { nome: 'asc' }
        })

        const serialized = disponiveis.map(a => ({
            ...a,
            valorDiaria: a.valorDiaria ? Number(a.valorDiaria) : 0
        }))

        return { data: serialized }
    } catch (err) {
        console.error("Erro ao buscar disponibilidade:", err)
        return { error: 'Falha ao consultar disponibilidade.' }
    }
}

export async function createReserva(formData: FormData) {
    try {
        const { pousadaId } = await requireAuth()

        const hospedeIdRaw = formData.get('hospedeId') as string
        const acomodacaoIdsRaw = formData.get('acomodacaoIds') as string
        const dataCheckinRaw = formData.get('dataCheckin') as string
        const dataCheckoutRaw = formData.get('dataCheckout') as string
        const totalHospedes = parseInt(formData.get('totalHospedes') as string) || 1
        const valorTotalRaw = formData.get('valorTotal') as string
        const observacoes = formData.get('observacoes') as string || null

        if (!hospedeIdRaw || !acomodacaoIdsRaw || !dataCheckinRaw || !dataCheckoutRaw || !valorTotalRaw) {
            return { error: 'Preencha todos os campos obrigatórios' }
        }

        let acomodacaoIds: string[] = []
        try {
            acomodacaoIds = JSON.parse(acomodacaoIdsRaw)
            if (!Array.isArray(acomodacaoIds) || acomodacaoIds.length === 0) {
                return { error: 'Selecione pelo menos uma acomodação.' }
            }
        } catch (e) {
            return { error: 'Formato de acomodações inválido.' }
        }

        // Feature: Cadastro Rápido de Hóspede inline
        let finalHospedeId = hospedeIdRaw;

        if (hospedeIdRaw === 'NOVO_HOSPEDE') {
            const novoNome = formData.get('novoHospedeNome') as string
            const novoCpf = formData.get('novoHospedeCpf') as string || null
            const novoTelefone = formData.get('novoHospedeTelefone') as string || null

            if (!novoNome) return { error: 'Informe pelo menos o nome do novo hóspede' }

            const novoHospede = await prisma.hospede.create({
                data: {
                    pousadaId,
                    nome: novoNome,
                    cpf: novoCpf,
                    telefone: novoTelefone,
                }
            })
            finalHospedeId = novoHospede.id
        }

        // Datas tratadas pro banco (Regra Hotelaria: Check-in 14h, Check-out 10h)
        const checkinBase = new Date(dataCheckinRaw)
        const checkoutBase = new Date(dataCheckoutRaw)

        // Aplica as horas exatas para não conflitar hospedagens cruzadas no mesmo dia de limpeza
        checkinBase.setUTCHours(14, 0, 0, 0)
        checkoutBase.setUTCHours(10, 0, 0, 0)

        const dataCheckin = checkinBase
        const dataCheckout = checkoutBase
        const valorTotal = parseFloat(valorTotalRaw.replace(',', '.'))

        if (dataCheckin >= dataCheckout) {
            return { error: 'A data de Check-out precisa ser posterior a de Check-in.' }
        }

        // --- VALIDAÇÃO ANTI-OVERBOOKING EM MASSA ---
        // Checar se há alguma reserva ativa que cruze este período em QUALQUER uma das acomodações solicitadas
        const reservasConflitantes = await prisma.reserva.findFirst({
            where: {
                acomodacaoId: { in: acomodacaoIds },
                status: { not: 'CANCELADA' }, // Canceladas perdem a cadeira
                AND: [
                    { dataCheckin: { lt: dataCheckout } }, // O novo cara sai depois do antigo entrar
                    { dataCheckout: { gt: dataCheckin } }  // O novo cara entra antes do antigo sair
                ]
            }
        })

        if (reservasConflitantes) {
            return { error: 'Overbooking: Alguma das acomodações selecionadas está indisponível para as datas.' }
        }

        // --- RATEIO DE VALOR E PESSOAS ---
        const amountOfRooms = acomodacaoIds.length;
        const valorRateado = valorTotal / amountOfRooms;

        // Distribui os hóspedes. Se sobrar, arredonda pra baixo. 
        // Ex: 3 hospedes em 2 quartos = Quarto A(1), Quarto B(1). O "excedente" (1) vai pro último quarto.
        const baseHospedes = Math.floor(totalHospedes / amountOfRooms);
        const remainderHospedes = totalHospedes % amountOfRooms;

        // --- CRIAÇÃO EM MASSA (TRANSACTION) ---
        await prisma.$transaction(
            acomodacaoIds.map((id, index) => {
                const hospedesNesteQuarto = baseHospedes + (index === amountOfRooms - 1 ? remainderHospedes : 0);

                return prisma.reserva.create({
                    data: {
                        pousadaId,
                        hospedeId: finalHospedeId,
                        acomodacaoId: id,
                        dataCheckin,
                        dataCheckout,
                        totalHospedes: hospedesNesteQuarto || 1, // garante no min 1
                        valorTotal: valorRateado,
                        observacoes,
                        status: 'PENDENTE', // (Módulo 11) Orçamento aguardando aceite/pagamento
                        checkInToken: crypto.randomUUID()
                    }
                });
            })
        )

        revalidatePath('/dashboard/reservas')
        revalidatePath('/dashboard/hospedes') // Revalida hóspedes tbm pra atualizar lista
        await broadcastPousadaChange(pousadaId)
        return { success: 'Reserva confirmada com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao registrar esta reserva' }
    }
}

// ----------------------------------------------------
// FLUXOS OPERACIONAIS (CHECK-IN e CHECK-OUT)
// ----------------------------------------------------

export async function confirmarReserva(reservaId: string) {
    try {
        const { pousadaId } = await requireAuth()

        const reserva = await prisma.reserva.findUnique({
            where: { id: reservaId, pousadaId }
        })

        if (!reserva) return { error: 'Reserva não encontrada' }
        if (reserva.status !== 'PENDENTE') return { error: 'Reserva não está pendente' }

        await prisma.reserva.update({
            where: { id: reservaId },
            data: { status: 'CONFIRMADA' }
        })

        revalidatePath('/dashboard/reservas')
        await broadcastPousadaChange(pousadaId)
        return { success: 'Reserva confirmada!' }
    } catch (err) {
        return { error: 'Ocorreu um erro ao atualizar a acomodação da reserva.' }
    }
}

// -------------------------------------------------------------
// GESTÃO DE CONSUMO (EXTRAS DA RESERVA)
// -------------------------------------------------------------

export async function addConsumoReserva(reservaId: string, data: {
    produtoId?: string;
    nomeAvulso?: string;
    valorUnitario: number;
    quantidade: number;
}) {
    try {
        const { pousadaId } = await requireAuth()

        // 1. Validar a Reserva
        const reserva = await prisma.reserva.findUnique({
            where: { id: reservaId, pousadaId }
        })

        if (!reserva) {
            return { error: 'Reserva não encontrada.' }
        }

        if (reserva.status !== 'CHECKIN_FEITO' && reserva.status !== 'CONFIRMADA') {
            return { error: 'Apenas reservas confirmadas ou em andamento podem receber consumos.' }
        }

        if (data.quantidade <= 0) {
            return { error: 'Quantidade deve ser maior que zero.' }
        }

        let descricaoFinal = data.nomeAvulso || 'Item Avulso'
        let valorRegistro = data.valorUnitario

        // Se escolheu um produto do catálogo real
        if (data.produtoId) {
            const produto = await prisma.produtoServico.findUnique({
                where: { id: data.produtoId, pousadaId }
            })

            if (!produto) return { error: 'Produto não encontrado no catálogo.' }
            if (!produto.ativo) return { error: 'Este produto está desativado no momento.' }

            descricaoFinal = produto.nome
            valorRegistro = Number(produto.preco) // Prioriza o valor do cadastro no momento do clique, ignorando input manual

            // Transaction: Inserir log e deduzir estoque (caso haja)
            await prisma.$transaction(async (tx) => {

                // Diminui o estoque
                if (produto.estoque !== null) {
                    if (produto.estoque < data.quantidade) {
                        throw new Error(`Estoque insuficiente. Restam apenas ${produto.estoque} unidades de ${produto.nome}.`)
                    }

                    await tx.produtoServico.update({
                        where: { id: produto.id },
                        data: {
                            estoque: { decrement: data.quantidade }
                        }
                    })
                }

                // Cria o Extra
                await tx.extraReserva.create({
                    data: {
                        reservaId: reserva.id,
                        produtoId: produto.id,
                        descricao: descricaoFinal,
                        valor: valorRegistro,
                        quantidade: data.quantidade
                    }
                })
            })
        } else {
            // Lançamento livre/"Avulso", apenas insere o log extra
            await prisma.extraReserva.create({
                data: {
                    reservaId: reserva.id,
                    produtoId: null, // Nenhum vinculo de catálogo
                    descricao: descricaoFinal,
                    valor: valorRegistro,
                    quantidade: data.quantidade
                }
            })
        }

        revalidatePath('/dashboard/reservas')
        revalidatePath('/dashboard/produtos')
        await broadcastPousadaChange(pousadaId)
        return { success: 'Consumo adicionado com sucesso!' }

    } catch (err: any) {
        return { error: err.message || 'Falha ao registrar consumo na reserva.' }
    }
}

export async function deleteExtraReserva(extraId: string) {
    try {
        const { pousadaId } = await requireAuth()

        // Confirma se o item logado pertence a pousada via reserva vinculada
        const extra = await prisma.extraReserva.findUnique({
            where: { id: extraId },
            include: { reserva: true }
        })

        if (!extra || extra.reserva.pousadaId !== pousadaId) {
            return { error: 'Item de consumo não encontrado.' }
        }

        // Se o Item foi deletado mas pertencia ao controle de um Produto real do catalogo, devolvemos o estoque do item
        if (extra.produtoId) {
            const produtoReal = await prisma.produtoServico.findUnique({ where: { id: extra.produtoId } })
            if (produtoReal && produtoReal.estoque !== null) {
                await prisma.produtoServico.update({
                    where: { id: extra.produtoId },
                    data: { estoque: { increment: extra.quantidade } }
                })
            }
        }

        // Deleta o log da Reserva
        await prisma.extraReserva.delete({ where: { id: extraId } })

        revalidatePath('/dashboard/reservas')
        revalidatePath('/dashboard/produtos')
        await broadcastPousadaChange(pousadaId)
        return { success: 'Item de consumo removido da fatura e estoque estornado.' }
    } catch (err: any) {
        return { error: 'Falha ao excluir item de consumo.' }
    }
}

export async function fazerCheckin(reservaId: string) {
    try {
        const { pousadaId, usuarioId } = await requireAuth()

        // 1. Busca reserva
        const reserva = await prisma.reserva.findUnique({
            where: { id: reservaId, pousadaId }
        })

        if (!reserva) return { error: 'Reserva não encontrada' }
        if (reserva.status !== 'PENDENTE' && reserva.status !== 'CONFIRMADA') {
            return { error: 'Status da reserva não permite Check-in' }
        }

        // 2. Transação: Atualiza Reserva + Atualiza Acomodação
        await prisma.$transaction([
            prisma.reserva.update({
                where: { id: reservaId },
                data: {
                    status: 'CHECKIN_FEITO',
                    checkinRealizadoEm: new Date(),
                    checkinPorId: usuarioId
                }
            }),
            prisma.acomodacao.update({
                where: { id: reserva.acomodacaoId },
                data: { status: 'OCUPADO' }
            })
        ])

        // Fire-and-forget: não bloqueia o check-in se a FNRH falhar
        enviarFnrh(reservaId).catch(err => console.error('[FNRH]', err))

        revalidatePath('/dashboard/reservas')
        revalidatePath('/dashboard/acomodacoes')
        await broadcastPousadaChange(pousadaId)
        return { success: 'Check-in realizado com sucesso! Quarto Ocupado.' }
    } catch (error) {
        return { error: 'Falha crítica ao realizar Check-in.' }
    }
}

export async function getResumoCheckout(reservaId: string) {
    try {
        const { pousadaId } = await requireAuth()

        const reserva = await prisma.reserva.findUnique({
            where: { id: reservaId, pousadaId },
            include: {
                hospede: { select: { nome: true, cpf: true, telefone: true } },
                acomodacao: { select: { nome: true, valorDiaria: true } },
                extras: true,
                pagamentos: true
            }
        })

        if (!reserva) return { error: 'Reserva não encontrada' }

        // Serializar Decimais
        return {
            data: {
                ...reserva,
                acomodacao: {
                    ...reserva.acomodacao,
                    valorDiaria: Number(reserva.acomodacao.valorDiaria)
                },
                valorTotal: Number(reserva.valorTotal),
                extras: (reserva.extras as any[]).map(e => ({ ...e, valor: Number(e.valor) })),
                pagamentos: (reserva.pagamentos as any[]).map(p => ({ ...p, valor: Number(p.valor) }))
            }
        }
    } catch (error) {
        return { error: 'Falha ao buscar resumo de checkout.' }
    }
}

export async function fazerCheckout(
    reservaId: string,
    formaPagamento: string,
    valorDesconto: number = 0,
    observacoesFinanceiras?: string
) {
    try {
        const { pousadaId, usuarioId } = await requireAuth()

        const reserva = await prisma.reserva.findUnique({
            where: { id: reservaId, pousadaId },
            include: { acomodacao: { select: { nome: true } }, extras: true }
        })

        if (!reserva) return { error: 'Reserva não encontrada' }
        if (reserva.status !== 'CHECKIN_FEITO') {
            return { error: 'O hóspede precisa ter feito Check-in antes.' }
        }

        const valorTotalOriginaHospedagem = Number(reserva.valorTotal)

        // Prepara os Múltiplos Registros no Caixa
        const lancamentosExtratoFinanceiro = [
            // 1. Sempre Lança o Faturamento da Hospedagem
            prisma.lancamentoFinanceiro.create({
                data: {
                    pousadaId,
                    tipo: 'ENTRADA' as any,
                    categoria: 'HOSPEDAGEM',
                    reservaId: reserva.id,
                    descricao: `Hospedagem - Acomodação ${reserva.acomodacao.nome} (Reserva #${reserva.id.slice(0, 6)})`,
                    valor: valorTotalOriginaHospedagem,
                    data: new Date(),
                    formaPagamento: formaPagamento as any,
                    observacoes: observacoesFinanceiras || 'Check-out realizado da Acomodação.'
                }
            }),
            // 2. Se houver consumos extras registrados, lança 1 entrada fracionada para cada
            ...reserva.extras.map(extra => prisma.lancamentoFinanceiro.create({
                data: {
                    pousadaId,
                    tipo: 'ENTRADA' as any,
                    categoria: 'CONSUMO',
                    reservaId: reserva.id,
                    descricao: `Consumo Quarto - ${extra.quantidade}x ${extra.descricao}`,
                    valor: Number(extra.valor) * extra.quantidade, // Total do item
                    data: new Date(),
                    formaPagamento: formaPagamento as any,
                    observacoes: `Extra atrelado a Reserva #${reserva.id.slice(0, 6)} da Acomodação ${reserva.acomodacao.nome}`
                }
            }))
        ]

        const blocosExtrasTransacao: any[] = []

        if (valorDesconto > 0) {
            lancamentosExtratoFinanceiro.push(
                prisma.lancamentoFinanceiro.create({
                    data: {
                        pousadaId,
                        tipo: 'SAIDA' as any, // Representa redução no caixa
                        categoria: 'HOSPEDAGEM',
                        reservaId: reserva.id,
                        descricao: `Desconto Concedido no Check-out`,
                        valor: valorDesconto, // Positivo, pois SAIDA já indica dedução no fluxo caso usemos depois
                        data: new Date(),
                        formaPagamento: formaPagamento as any,
                        observacoes: 'Desconto aplicado diretamente no fechamento.'
                    }
                })
            )
            blocosExtrasTransacao.push(
                prisma.extraReserva.create({
                    data: {
                        reservaId,
                        descricao: 'Desconto Automático de Check-out',
                        valor: -valorDesconto,
                        quantidade: 1
                    }
                })
            )
        }

        // 2. Transação: Checkout + Quarto Sujo + Tarefa + [Múltiplos Lancamentos Financeiros]
        await prisma.$transaction([
            prisma.reserva.update({
                where: { id: reservaId },
                data: {
                    status: 'CHECKOUT_FEITO',
                    checkoutRealizadoEm: new Date(),
                    checkoutPorId: usuarioId
                }
            }),
            prisma.acomodacao.update({
                where: { id: reserva.acomodacaoId },
                data: { status: 'LIMPEZA' }
            }),
            prisma.tarefa.create({
                data: {
                    pousadaId,
                    titulo: 'Limpeza de Check-out',
                    tipo: 'LIMPEZA',
                    prioridade: 'NORMAL',
                    descricao: 'Quarto liberado após check-out. Necessário trocar enxoval e repor itens básicos.',
                    acomodacaoId: reserva.acomodacaoId,
                    status: 'PENDENTE'
                }
            }),
            // Lançamentos
            ...lancamentosExtratoFinanceiro,
            ...blocosExtrasTransacao
        ])

        revalidatePath('/dashboard/reservas')
        revalidatePath('/dashboard/acomodacoes')
        revalidatePath('/dashboard/tarefas')
        revalidatePath('/dashboard/financeiro')
        await broadcastPousadaChange(pousadaId)
        return { success: 'Check-out realizado com sucesso! Fechamento de conta registrado.' }
    } catch (error) {
        return { error: 'Falha crítica ao realizar Check-out.' }
    }
}

export async function cancelarReserva(reservaId: string) {
    try {
        const { pousadaId } = await requireAuth()

        await prisma.reserva.update({
            where: { id: reservaId, pousadaId },
            data: { status: 'CANCELADA' }
        })

        revalidatePath('/dashboard/reservas')
        await broadcastPousadaChange(pousadaId)
        return { success: 'Reserva cancelada.' }
    } catch (error) {
        return { error: 'Não foi possível cancelar.' }
    }
}

export async function registrarNoShow(reservaId: string) {
    try {
        const { pousadaId } = await requireAuth()

        const reserva = await prisma.reserva.findUnique({
            where: { id: reservaId, pousadaId },
            select: { status: true }
        })

        if (!reserva) return { error: 'Reserva não encontrada.' }
        if (!['PENDENTE', 'CONFIRMADA'].includes(reserva.status)) {
            return { error: 'Só é possível registrar No Show em reservas pendentes ou confirmadas.' }
        }

        await prisma.reserva.update({
            where: { id: reservaId, pousadaId },
            data: { status: 'NO_SHOW' }
        })

        revalidatePath('/dashboard/reservas')
        await broadcastPousadaChange(pousadaId)
        return { success: 'No Show registrado.' }
    } catch (error) {
        return { error: 'Não foi possível registrar o No Show.' }
    }
}
