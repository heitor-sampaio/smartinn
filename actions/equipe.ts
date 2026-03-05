'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Verificação auxiliar para evitar repetição
async function checaAuth(pousadaId: string) {
    const hasAuth = cookies().get(`equipe_auth_${pousadaId}`)?.value === 'true';
    if (!hasAuth) {
        throw new Error('Não autenticado');
    }
}

export async function loginEquipe({ pousadaId: linkEquipe, senha }: { pousadaId: string, senha: string }) {
    if (!senha) return { error: 'A senha é obrigatória' };

    const pousada = await prisma.pousada.findUnique({
        where: { linkEquipe },
        select: { senhaEquipe: true }
    });

    if (!pousada) return { error: 'Pousada não encontrada' };
    if (!pousada.senhaEquipe) return { error: 'Acesso da equipe não configurado' };
    if (pousada.senhaEquipe !== senha) return { error: 'Senha incorreta' };

    // Define cookie por 30 dias na raiz
    cookies().set(`equipe_auth_${linkEquipe}`, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 dias
    });

    return { success: true };
}

export async function logoutEquipe(linkEquipe: string) {
    cookies().delete(`equipe_auth_${linkEquipe}`);
    redirect(`/equipe/${linkEquipe}`);
}

export async function getTarefasEquipe(pousadaId: string) {
    try {
        await checaAuth(pousadaId);

        const tarefas = await prisma.tarefa.findMany({
            where: {
                pousadaId,
                status: {
                    notIn: ['CONCLUIDA', 'CANCELADA']
                },
                tipo: {
                    in: ['LIMPEZA', 'MANUTENCAO', 'PREPARACAO']
                }
            },
            include: {
                acomodacao: {
                    select: { nome: true }
                }
            },
            orderBy: [
                { prioridade: 'asc' }, // URGENTE vem primeiro SE a ordem bater. (URGENTE, NORMAL, BAIXA)
                { criadoEm: 'desc' }
            ]
        });

        return tarefas;
    } catch (error: any) {
        console.error('Erro getTarefasEquipe:', error.message);
        throw new Error(error.message);
    }
}

export async function concluirTarefaEquipe(pousadaId: string, tarefaId: string) {
    try {
        await checaAuth(pousadaId);

        await prisma.tarefa.update({
            where: { id: tarefaId, pousadaId }, // Garante que é da mesma pousada
            data: {
                status: 'CONCLUIDA',
                concluidaEm: new Date()
            }
        });

        // revalidar p/ atualizar a tela
        // Como chamaremos de dentro do client component no painel, ele dará router.refresh
        return { success: true };
    } catch (error: any) {
        console.error('Erro concluirTarefa:', error.message);
        return { success: false, error: 'Erro ao concluir tarefa' };
    }
}
