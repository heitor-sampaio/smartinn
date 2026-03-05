'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'

export async function getHospedes() {
    try {
        const { pousadaId } = await requireAuth()

        const hospedes = await prisma.hospede.findMany({
            where: { pousadaId },
            include: {
                reservas: {
                    include: { acomodacao: { select: { nome: true } } },
                    orderBy: { dataCheckin: 'desc' }
                }
            },
            orderBy: [
                { criadoEm: 'desc' } // Mais recentes no topo
            ]
        })

        // Serializar Decimals (valorTotal) e Datas (Date -> ISO String) para evitar erros de Server Components
        const serialized = hospedes.map(hosp => ({
            ...hosp,
            dataNascimento: hosp.dataNascimento ? hosp.dataNascimento.toISOString() : null,
            criadoEm: hosp.criadoEm.toISOString(),
            atualizadoEm: hosp.atualizadoEm.toISOString(),
            reservas: hosp.reservas.map(res => ({
                ...res,
                dataCheckin: res.dataCheckin.toISOString(),
                dataCheckout: res.dataCheckout.toISOString(),
                criadoEm: res.criadoEm.toISOString(),
                atualizadoEm: res.atualizadoEm.toISOString(),
                valorTotal: Number(res.valorTotal)
            }))
        }))

        return { data: serialized }
    } catch (error) {
        return { error: 'Falha ao buscar a lista de hóspedes' }
    }
}

export async function createHospede(formData: FormData) {
    try {
        const { pousadaId } = await requireAuth()

        const nome = formData.get('nome') as string
        if (!nome) return { error: 'O nome do hóspede é obrigatório' }

        const email = formData.get('email') as string || null
        const telefone = formData.get('telefone') as string || null
        const cpf = formData.get('cpf') as string || null

        // Tratamento básico da ISO Date proveniente do Input type="date"
        const rawDate = formData.get('dataNascimento') as string
        const dataNascimento = rawDate ? new Date(rawDate) : null

        const endereco = formData.get('endereco') as string || null
        const cidade = formData.get('cidade') as string || null
        const estado = formData.get('estado') as string || null
        const observacoes = formData.get('observacoes') as string || null

        await prisma.hospede.create({
            data: {
                pousadaId,
                nome,
                email,
                telefone,
                cpf,
                dataNascimento,
                endereco,
                cidade,
                estado,
                observacoes
            }
        })

        revalidatePath('/dashboard/hospedes')
        return { success: 'Hóspede cadastrado com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao cadastrar este hóspede' }
    }
}

export async function updateHospede(id: string, formData: FormData) {
    try {
        const { pousadaId } = await requireAuth()

        const nome = formData.get('nome') as string
        if (!nome) return { error: 'O nome é obrigatório' }

        const email = formData.get('email') as string || null
        const telefone = formData.get('telefone') as string || null
        const cpf = formData.get('cpf') as string || null

        // Converte novamente ou manda null
        const rawDate = formData.get('dataNascimento') as string
        const dataNascimento = rawDate ? new Date(rawDate) : null

        const endereco = formData.get('endereco') as string || null
        const cidade = formData.get('cidade') as string || null
        const estado = formData.get('estado') as string || null
        const observacoes = formData.get('observacoes') as string || null

        // Verifica Tenant
        await prisma.hospede.update({
            where: {
                id,
                pousadaId
            },
            data: {
                nome,
                email,
                telefone,
                cpf,
                dataNascimento,
                endereco,
                cidade,
                estado,
                observacoes
            }
        })

        revalidatePath('/dashboard/hospedes')
        return { success: 'Ficha do hóspede atualizada com sucesso!' }
    } catch (error) {
        return { error: 'Erro ao atualizar dados do hóspede' }
    }
}

export async function deleteHospede(id: string) {
    try {
        const { pousadaId } = await requireAuth()

        await prisma.hospede.delete({
            where: {
                id,
                pousadaId
            }
        })

        revalidatePath('/dashboard/hospedes')
        return { success: 'O registro do hóspede foi removido!' }
    } catch (error) {
        return { error: 'Não é possível excluir. Caso o hóspede tenha um histórico de reservas, estas devem ser tratadas primeiro.' }
    }
}
