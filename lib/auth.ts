'use server'

import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'

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
        select: { id: true, pousadaId: true, perfil: true }
    })

    if (!usuario) throw new Error(`Usuário não encontrado no sistema: supabaseId=${user.id}`)

    return {
        user,
        usuarioId: usuario.id,
        pousadaId: usuario.pousadaId,
        perfil: usuario.perfil
    }
})
