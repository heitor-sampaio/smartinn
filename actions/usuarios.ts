'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function listarUsuarios() {
    try {
        const { pousadaId, perfil } = await requireAuth()
        if (perfil !== 'ADMIN') return { error: 'Acesso restrito a administradores.' }

        const usuarios = await prisma.usuario.findMany({
            where: { pousadaId, perfil: { in: ['RECEPCIONISTA', 'EQUIPE'] } },
            select: { id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true },
            orderBy: { criadoEm: 'asc' },
        })

        return { data: usuarios }
    } catch (error) {
        console.error('Erro ao listar usuários:', error)
        return { error: 'Falha ao buscar os usuários' }
    }
}

export async function criarUsuario({
    nome,
    email,
    senha,
    perfil,
}: {
    nome: string
    email: string
    senha: string
    perfil: 'RECEPCIONISTA' | 'EQUIPE'
}) {
    try {
        const { pousadaId, perfil: adminPerfil } = await requireAuth()
        if (adminPerfil !== 'ADMIN') return { error: 'Acesso restrito a administradores.' }

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: senha,
            email_confirm: true,
        })

        if (authError) {
            if (
                authError.message.toLowerCase().includes('already registered') ||
                authError.message.toLowerCase().includes('already been registered') ||
                (authError as any).code === 'email_exists'
            ) {
                return { error: 'Este e-mail já está cadastrado no sistema.' }
            }
            return { error: authError.message }
        }

        await prisma.usuario.create({
            data: {
                pousadaId,
                supabaseId: authData.user.id,
                nome,
                email,
                perfil,
            },
        })

        revalidatePath('/dashboard/configuracoes')
        return { success: true }
    } catch (error: any) {
        console.error('Erro ao criar usuário:', error)
        return { error: error.message || 'Erro ao criar o usuário' }
    }
}

export async function desativarUsuario(id: string) {
    try {
        const { pousadaId, perfil } = await requireAuth()
        if (perfil !== 'ADMIN') return { error: 'Acesso restrito a administradores.' }

        await prisma.usuario.update({
            where: { id, pousadaId },
            data: { ativo: false },
        })

        revalidatePath('/dashboard/configuracoes')
        return { success: true }
    } catch (error) {
        console.error('Erro ao desativar usuário:', error)
        return { error: 'Erro ao desativar o usuário' }
    }
}

export async function ativarUsuario(id: string) {
    try {
        const { pousadaId, perfil } = await requireAuth()
        if (perfil !== 'ADMIN') return { error: 'Acesso restrito a administradores.' }

        await prisma.usuario.update({
            where: { id, pousadaId },
            data: { ativo: true },
        })

        revalidatePath('/dashboard/configuracoes')
        return { success: true }
    } catch (error) {
        console.error('Erro ao ativar usuário:', error)
        return { error: 'Erro ao ativar o usuário' }
    }
}

export async function excluirUsuario(id: string) {
    try {
        const { pousadaId, perfil } = await requireAuth()
        if (perfil !== 'ADMIN') return { error: 'Acesso restrito a administradores.' }

        const usuario = await prisma.usuario.findUnique({
            where: { id, pousadaId },
            select: { supabaseId: true },
        })

        if (!usuario) return { error: 'Usuário não encontrado' }

        await prisma.usuario.delete({ where: { id, pousadaId } })
        await supabaseAdmin.auth.admin.deleteUser(usuario.supabaseId)

        revalidatePath('/dashboard/configuracoes')
        return { success: true }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error)
        return { error: 'Erro ao excluir o usuário' }
    }
}
