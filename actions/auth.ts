'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

export async function signIn(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    redirect('/dashboard')
}

export async function signUp(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const nomePousada = formData.get('nomePousada') as string
    const nomeUsuario = formData.get('nomeUsuario') as string

    if (!email || !password || !nomePousada || !nomeUsuario) {
        return { error: "Todos os campos são obrigatórios." }
    }

    const supabase = createClient()

    // 1. Cadastra no Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    // AuthError comum é o limite de e-mails ou restrição
    if (authError || !data.user) {
        return { error: authError?.message || "Falha ao criar conta. Verifique os dados." }
    }

    const supabaseId = data.user.id

    try {
        // 2. Transação no Prisma para gerar a Pousada e o Usuário Admin Vinculado
        await prisma.$transaction(async (tx) => {
            const pousada = await tx.pousada.create({
                data: {
                    nome: nomePousada,
                    email: email,
                }
            })

            await tx.usuario.create({
                data: {
                    pousadaId: pousada.id,
                    supabaseId: supabaseId,
                    nome: nomeUsuario,
                    email: email,
                    perfil: 'ADMIN' // Dono da pousada possui passe livre
                }
            })
        })
    } catch (error) {
        console.error("Erro interno no registro (Prisma):", error)
        return { error: "Conta criada, mas ocorreu um erro interno ao setar sua Pousada. Contate o suporte." }
    }

    // Sempre retorna sucesso e deixa o Client Component fazer o redirect pro /login
    return { success: "Conta criada com sucesso! Você será redirecionado para o login." }
}

export async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function resetPassword(formData: FormData) {
    const email = formData.get('email') as string
    const supabase = createClient()

    if (!email) {
        return { error: "O e-mail é obrigatório." }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Redireciona o usuário de volta via callback Route para processar
        // com segurança o código PKCE, antes de levá-lo de fato à tela.
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/redefinir-senha`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: "E-mail de recuperação enviado! Cheque sua caixa de entrada ou spam." }
}

export async function updatePassword(formData: FormData) {
    const password = formData.get('password') as string
    const supabase = createClient()

    if (!password || password.length < 6) {
        return { error: "A senha deve ter pelo menos 6 caracteres." }
    }

    // Como o usuário já teve sua sessão estabelecida pelo link do e-mail
    // a gente apenas pede a atualização de user
    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return { error: error.message }
    }

    redirect('/dashboard')
}
