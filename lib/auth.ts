'use server'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { PerfilUsuario } from '@prisma/client'

/**
 * Autenticação com cache por requisição usando React cache().
 * Garante que a query ao banco seja feita UMA ÚNICA VEZ por request,
 * mesmo que múltiplas actions chamem requireAuth() em paralelo.
 */
export const requireAuth = cache(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autorizado')

    const usuario = await prisma.usuario.findUnique({
        where: { supabaseId: user.id },
        select: { id: true, pousadaId: true, perfil: true, ativo: true }
    })

    if (!usuario) throw new Error('Usuário não encontrado no sistema.')
    if (!usuario.ativo) throw new Error('Conta desativada')

    return {
        user,
        usuarioId: usuario.id,
        pousadaId: usuario.pousadaId,
        perfil: usuario.perfil
    }
})

export async function requireRole(allowed: PerfilUsuario[]) {
    const auth = await requireAuth()
    if (!allowed.includes(auth.perfil)) {
        redirect(auth.perfil === 'EQUIPE' ? '/dashboard/tarefas' : '/dashboard')
    }
    return auth
}
