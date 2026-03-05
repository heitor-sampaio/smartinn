'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const configSchema = z.object({
    horaCheckin: z.string().min(5),
    horaCheckout: z.string().min(5),
    taxaCartao: z.coerce.number().min(0).max(100),
    nome: z.string().min(2),
    telefone: z.string().optional(),
    email: z.string().email(),
    cnpj: z.string().optional(),
    inscricaoEstadual: z.string().optional(),
    endereco: z.string().optional(),
    cep: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    senhaEquipe: z.string().optional(),
    modoTema: z.string().optional(),
    tarifasDinamicasAtivas: z.boolean().optional().default(false),
    tarifaFimDeSemana: z.coerce.number().min(0).default(0),
    tarifaFeriado: z.coerce.number().min(0).default(0),
    tarifaTemporada: z.coerce.number().min(0).default(0),
    inicioTemporada: z.coerce.date().nullable().optional(),
    fimTemporada: z.coerce.date().nullable().optional(),
});

type ConfigInput = z.infer<typeof configSchema>;

export async function getAjustes() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('Não autenticado');
        }

        // Busca o usuário local para pegar o pousadaId
        const usuarioLogado = await prisma.usuario.findUnique({
            where: { supabaseId: user.id },
            select: { pousadaId: true },
        });

        if (!usuarioLogado) {
            throw new Error('Usuário não encontrado');
        }

        const pousada = await prisma.pousada.findUnique({
            where: { id: usuarioLogado.pousadaId },
        });

        return pousada;
    } catch (error: any) {
        console.error('Erro ao buscar configurações:', error);
        throw new Error(error.message || 'Erro ao carregar configurações');
    }
}

export async function updateAjustes(data: ConfigInput) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('Não autenticado');
        }

        const usuarioLogado = await prisma.usuario.findUnique({
            where: { supabaseId: user.id },
            select: { pousadaId: true },
        });

        if (!usuarioLogado) {
            throw new Error('Usuário não encontrado');
        }

        const validData = configSchema.parse(data);

        console.log('SAVING CONFIG:', { userId: user.id, pousadaId: usuarioLogado.pousadaId });

        const updatedPousada = await prisma.pousada.update({
            where: { id: usuarioLogado.pousadaId },
            data: {
                horaCheckin: validData.horaCheckin,
                horaCheckout: validData.horaCheckout,
                taxaCartao: validData.taxaCartao,
                nome: validData.nome,
                telefone: validData.telefone,
                email: validData.email,
                cnpj: validData.cnpj,
                inscricaoEstadual: validData.inscricaoEstadual,
                endereco: validData.endereco,
                cep: validData.cep,
                cidade: validData.cidade,
                estado: validData.estado,
                senhaEquipe: validData.senhaEquipe,
                modoTema: validData.modoTema,
                tarifasDinamicasAtivas: validData.tarifasDinamicasAtivas,
                tarifaFimDeSemana: validData.tarifaFimDeSemana,
                tarifaFeriado: validData.tarifaFeriado,
                tarifaTemporada: validData.tarifaTemporada,
                inicioTemporada: validData.inicioTemporada || null,
                fimTemporada: validData.fimTemporada || null,
            },
        });

        revalidatePath('/', 'layout');
        revalidatePath('/dashboard', 'layout');
        revalidatePath('/dashboard/configuracoes');

        return {
            success: true,
            pousada: updatedPousada
        };
    } catch (error: any) {
        console.error('Erro ao atualizar configurações:', error);
        return {
            success: false,
            error: error.message || 'Erro ao salvar as configurações. Verifique os dados.',
        };
    }
}
