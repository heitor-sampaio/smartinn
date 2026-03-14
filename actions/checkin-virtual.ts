'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { broadcastPousadaChange } from '@/lib/broadcast'

export async function getReservaByToken(token: string) {
    try {
        const reserva = await prisma.reserva.findUnique({
            where: { checkInToken: token },
            include: {
                hospede: true,
                acomodacao: { select: { nome: true, tipo: true } },
                pousada: { select: { nome: true, logoUrl: true } }
            }
        })

        if (!reserva) return { error: 'Link de check-in inválido ou expirado.' }

        if (reserva.status === 'CHECKOUT_FEITO' || reserva.status === 'CANCELADA') {
            return { error: `Esta reserva está ${reserva.status === 'CANCELADA' ? 'cancelada' : 'encerrada'} e não aceita mais alterações.` }
        }

        // Expire token 30 days after checkout
        const expiresAt = new Date(reserva.dataCheckout)
        expiresAt.setDate(expiresAt.getDate() + 30)
        if (new Date() > expiresAt) {
            return { error: 'Este link de check-in expirou.' }
        }

        return {
            data: {
                id: reserva.id,
                status: reserva.status,
                dataCheckin: reserva.dataCheckin.toISOString(),
                dataCheckout: reserva.dataCheckout.toISOString(),
                acomodacao: reserva.acomodacao,
                pousada: reserva.pousada,
                hospede: {
                    id: reserva.hospede.id,
                    nome: reserva.hospede.nome,
                    cpf: reserva.hospede.cpf,
                    telefone: reserva.hospede.telefone,
                    email: reserva.hospede.email,
                    dataNascimento: reserva.hospede.dataNascimento?.toISOString() ?? null,
                    cep: reserva.hospede.cep,
                    endereco: reserva.hospede.endereco,
                    cidade: reserva.hospede.cidade,
                    estado: reserva.hospede.estado,
                }
            }
        }
    } catch (error) {
        console.error('getReservaByToken error:', error)
        return { error: 'Erro ao buscar informações da reserva.' }
    }
}

export async function salvarDadosCheckin(token: string, data: {
    nome: string
    cpf?: string
    telefone?: string
    email?: string
    dataNascimento?: string
    cep?: string
    endereco?: string
    cidade?: string
    estado?: string
    nacionalidade?: string
    tipoDocumento?: string
    numeroDocumento?: string
    motivoEstadia?: string
    genero?: string
}) {
    try {
        const reserva = await prisma.reserva.findUnique({
            where: { checkInToken: token },
            select: { id: true, hospedeId: true, status: true }
        })

        if (!reserva) return { error: 'Link de check-in inválido.' }
        if (reserva.status === 'CHECKOUT_FEITO' || reserva.status === 'CANCELADA') {
            return { error: 'Esta reserva não permite mais alterações.' }
        }

        await prisma.hospede.update({
            where: { id: reserva.hospedeId },
            data: {
                nome: data.nome,
                cpf: data.cpf || null,
                telefone: data.telefone || null,
                email: data.email || null,
                dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
                cep: data.cep || null,
                endereco: data.endereco || null,
                cidade: data.cidade || null,
                estado: data.estado || null,
                nacionalidade: data.nacionalidade || null,
                tipoDocumento: (data.tipoDocumento as any) || null,
                numeroDocumento: data.numeroDocumento || null,
                motivoEstadia: (data.motivoEstadia as any) || null,
                genero: (data.genero as any) || null,
            }
        })

        return { success: 'Dados salvos com sucesso! Obrigado pelo preenchimento.' }
    } catch (error) {
        console.error('salvarDadosCheckin error:', error)
        return { error: 'Erro ao salvar seus dados. Tente novamente.' }
    }
}

export async function getReservaFichaByToken(token: string) {
    try {
        const reserva = await prisma.reserva.findUnique({
            where: { checkInToken: token },
            include: {
                hospede: { select: { nome: true } },
                acomodacao: { select: { nome: true, tipo: true } },
                pousada: { select: { nome: true, logoUrl: true, ramalRecepcao: true, nomeWifi: true, senhaWifi: true } },
                extras: {
                    orderBy: { criadoEm: 'asc' },
                    select: { id: true, descricao: true, valor: true, quantidade: true }
                },
                tarefas: {
                    where: { tipo: 'LIMPEZA', titulo: { contains: 'Hóspede' } },
                    orderBy: { criadoEm: 'desc' },
                    take: 1,
                    select: { id: true, status: true, concluidaEm: true }
                }
            }
        })

        if (!reserva) return { error: 'Ficha não encontrada.' }
        if (reserva.status === 'CANCELADA') return { error: 'Esta reserva foi cancelada.' }

        // Only expose wifi password while guest is actively checked in
        const pousadaInfo = {
            ...reserva.pousada,
            senhaWifi: reserva.status === 'CHECKIN_FEITO' ? reserva.pousada.senhaWifi : null,
        }

        return {
            data: {
                id: reserva.id,
                status: reserva.status,
                dataCheckin: reserva.dataCheckin.toISOString(),
                dataCheckout: reserva.dataCheckout.toISOString(),
                totalHospedes: reserva.totalHospedes,
                valorTotal: Number(reserva.valorTotal),
                acomodacao: reserva.acomodacao,
                pousada: pousadaInfo,
                pousadaId: reserva.pousadaId,
                hospedeNome: reserva.hospede.nome,
                extras: reserva.extras.map(e => ({
                    id: e.id,
                    descricao: e.descricao,
                    valor: Number(e.valor),
                    quantidade: e.quantidade,
                })),
                tarefaLimpeza: reserva.tarefas.length > 0
                    ? {
                        id: reserva.tarefas[0].id,
                        status: reserva.tarefas[0].status,
                        concluidaEm: reserva.tarefas[0].concluidaEm?.toISOString() ?? null,
                    }
                    : null,
            }
        }
    } catch (error) {
        console.error('getReservaFichaByToken error:', error)
        return { error: 'Erro ao buscar ficha da reserva.' }
    }
}

export async function confirmarLimpeza(token: string) {
    try {
        const reserva = await prisma.reserva.findUnique({
            where: { checkInToken: token },
            select: { id: true, pousadaId: true, status: true }
        })

        if (!reserva) return { error: 'Reserva não encontrada.' }
        if (reserva.status !== 'CHECKIN_FEITO') return { error: 'Reserva não está em hospedagem.' }

        await prisma.tarefa.updateMany({
            where: {
                reservaId: reserva.id,
                tipo: 'LIMPEZA',
                status: 'CONCLUIDA',
                titulo: { contains: 'Hóspede' }
            },
            data: { reservaId: null }
        })

        await broadcastPousadaChange(reserva.pousadaId)
        return { success: true }
    } catch (error) {
        console.error('confirmarLimpeza error:', error)
        return { error: 'Erro ao confirmar limpeza.' }
    }
}

export async function solicitarLimpeza(token: string) {
    try {
        const reserva = await prisma.reserva.findUnique({
            where: { checkInToken: token },
            select: { id: true, pousadaId: true, acomodacaoId: true, status: true, acomodacao: { select: { nome: true } } }
        })

        if (!reserva) return { error: 'Reserva não encontrada.' }
        if (reserva.status !== 'CHECKIN_FEITO') return { error: 'O quarto só pode ser liberado após o check-in.' }

        // Evita duplicatas: verifica se já há limpeza pendente desta reserva
        const tarefaExistente = await prisma.tarefa.findFirst({
            where: {
                reservaId: reserva.id,
                tipo: 'LIMPEZA',
                status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
                titulo: { contains: 'Hóspede' }
            }
        })

        if (tarefaExistente) return { already: true }

        await prisma.tarefa.create({
            data: {
                pousadaId: reserva.pousadaId,
                acomodacaoId: reserva.acomodacaoId,
                reservaId: reserva.id,
                tipo: 'LIMPEZA',
                prioridade: 'NORMAL',
                titulo: `Limpeza solicitada pelo Hóspede — ${reserva.acomodacao.nome}`,
                descricao: 'O hóspede informou que o quarto está disponível para limpeza durante a estadia.',
                status: 'PENDENTE',
            }
        })

        revalidatePath('/dashboard/tarefas')
        await broadcastPousadaChange(reserva.pousadaId)
        return { success: true }
    } catch (error) {
        console.error('solicitarLimpeza error:', error)
        return { error: 'Erro ao solicitar limpeza. Tente novamente.' }
    }
}

export async function gerarTokenCheckin(reservaId: string) {
    try {
        const { pousadaId } = await requireAuth()

        const reserva = await prisma.reserva.findUnique({
            where: { id: reservaId, pousadaId }
        })

        if (!reserva) return { error: 'Reserva não encontrada.' }

        const token = crypto.randomUUID()

        await prisma.reserva.update({
            where: { id: reservaId },
            data: { checkInToken: token }
        })

        revalidatePath('/dashboard/reservas')
        return { success: true, token }
    } catch (error) {
        console.error('gerarTokenCheckin error:', error)
        return { error: 'Erro ao gerar link de check-in.' }
    }
}
