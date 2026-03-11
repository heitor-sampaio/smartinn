'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

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
    endereco?: string
    cidade?: string
    estado?: string
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
                endereco: data.endereco || null,
                cidade: data.cidade || null,
                estado: data.estado || null,
            }
        })

        return { success: 'Dados salvos com sucesso! Obrigado pelo preenchimento.' }
    } catch (error) {
        console.error('salvarDadosCheckin error:', error)
        return { error: 'Erro ao salvar seus dados. Tente novamente.' }
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
