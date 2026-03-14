'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const FNRH_API_URL =
    process.env.FNRH_API_URL ??
    (process.env.NODE_ENV === 'production'
        ? 'https://fnrh.turismo.serpro.gov.br/FNRH_API/rest/v1'
        : 'https://hom-lowcode.serpro.gov.br/FNRH_API/rest/v1')

// Mapeamento de enums do banco → valores esperados pela API MTUR
const MOTIVO_MAP: Record<string, string> = {
    LAZER: 'LAZER',
    NEGOCIOS: 'NEGOCIO',
    SAUDE: 'SAUDE',
    EVENTOS: 'EVENTO',
    OUTROS: 'OUTROS',
}

const GENERO_MAP: Record<string, string> = {
    MASCULINO: 'M',
    FEMININO: 'F',
    NAO_INFORMADO: 'N',
}

const TIPO_DOC_MAP: Record<string, string> = {
    CPF: 'CPF',
    PASSAPORTE: 'PASSAPORTE',
    RG: 'RG',
    CNH: 'CNH',
    RNE: 'RNE',
}

/**
 * Envia a ficha do hóspede à API MTUR/Serpro.
 * Chamada internamente — não requer requireAuth().
 * Fire-and-forget: não bloqueia o check-in se a FNRH falhar.
 */
export async function enviarFnrh(reservaId: string) {
    const reserva = await prisma.reserva.findUnique({
        where: { id: reservaId },
        include: {
            hospede: true,
            pousada: true,
            acomodacao: { select: { nome: true } },
        },
    })

    if (!reserva) {
        console.warn('[FNRH] Reserva não encontrada:', reservaId)
        return
    }

    const { pousada, hospede } = reserva

    if (!pousada.fnrhAtivo) {
        console.info('[FNRH] Integração desabilitada para esta pousada.')
        return
    }

    if (!pousada.fnrhUser || !pousada.fnrhKey) {
        console.warn('[FNRH] Credenciais não configuradas para a pousada:', pousada.id)
        return
    }

    // Determina tipo e número do documento
    const tipoDoc = hospede.tipoDocumento
        ? TIPO_DOC_MAP[hospede.tipoDocumento] ?? 'CPF'
        : 'CPF'
    const numDoc = hospede.numeroDocumento || hospede.cpf || ''

    const payload = {
        nomeHospede: hospede.nome,
        dataNascimento: hospede.dataNascimento
            ? hospede.dataNascimento.toISOString().split('T')[0]
            : undefined,
        nacionalidade: hospede.nacionalidade ?? 'BR',
        tipoDocumento: tipoDoc,
        numeroDocumento: numDoc,
        genero: hospede.genero ? GENERO_MAP[hospede.genero] : undefined,
        motivoEstadia: hospede.motivoEstadia
            ? MOTIVO_MAP[hospede.motivoEstadia]
            : undefined,
        email: hospede.email ?? undefined,
        telefone: hospede.telefone ?? undefined,
        meioHospedagem: {
            nome: pousada.nome,
            cnpj: pousada.cnpj ?? undefined,
        },
        acomodacao: reserva.acomodacao.nome,
        dataCheckin: reserva.dataCheckin.toISOString().split('T')[0],
        dataCheckout: reserva.dataCheckout.toISOString().split('T')[0],
        totalHospedes: reserva.totalHospedes,
    }

    try {
        const response = await fetch(`${FNRH_API_URL}/hospedes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                User: pousada.fnrhUser,
                Key: pousada.fnrhKey,
            },
            body: JSON.stringify(payload),
        })

        if (response.ok) {
            let fnrhId: string | undefined
            try {
                const json = await response.json()
                fnrhId = json?.id ?? json?.protocolo ?? undefined
            } catch {
                // response body não é JSON — ignora
            }

            await prisma.reserva.update({
                where: { id: reservaId },
                data: {
                    fnrhStatus: 'ENVIADO',
                    fnrhId: fnrhId ?? null,
                    fnrhEnviadoEm: new Date(),
                    fnrhErro: null,
                },
            })
            console.info('[FNRH] Enviado com sucesso. Reserva:', reservaId)
        } else {
            const errorText = await response.text().catch(() => `HTTP ${response.status}`)
            await prisma.reserva.update({
                where: { id: reservaId },
                data: {
                    fnrhStatus: 'ERRO',
                    fnrhErro: `HTTP ${response.status}: ${errorText}`.slice(0, 500),
                },
            })
            console.error('[FNRH] Erro na resposta da API:', response.status, errorText)
        }
    } catch (err: any) {
        await prisma.reserva.update({
            where: { id: reservaId },
            data: {
                fnrhStatus: 'ERRO',
                fnrhErro: (err?.message ?? 'Erro desconhecido').slice(0, 500),
            },
        })
        console.error('[FNRH] Erro de rede:', err)
    }
}

/**
 * Permite ao recepcionista reenviar a FNRH manualmente pelo painel.
 */
export async function reenviarFnrh(reservaId: string) {
    try {
        const { pousadaId } = await requireAuth()

        const reserva = await prisma.reserva.findUnique({
            where: { id: reservaId, pousadaId },
            select: { id: true },
        })

        if (!reserva) return { error: 'Reserva não encontrada.' }

        await prisma.reserva.update({
            where: { id: reservaId },
            data: { fnrhStatus: 'PENDENTE', fnrhErro: null },
        })

        await enviarFnrh(reservaId)

        revalidatePath('/dashboard/reservas')
        return { success: true }
    } catch (err: any) {
        return { error: err?.message ?? 'Erro ao reenviar FNRH.' }
    }
}
