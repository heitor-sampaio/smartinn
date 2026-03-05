'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Helper de Autenticação e Segurança (Mesma lógica das outras server actions)
async function requireAuth() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Não autorizado')

    const usuario = await prisma.usuario.findUnique({
        where: { supabaseId: user.id },
        select: { pousadaId: true, perfil: true }
    })

    if (!usuario) throw new Error('Usuário não encontrado no sistema')

    return { user, pousadaId: usuario.pousadaId, perfil: usuario.perfil }
}

export async function getProdutosList() {
    try {
        const { pousadaId } = await requireAuth()

        const produtos = await prisma.produtoServico.findMany({
            where: { pousadaId },
            orderBy: [
                { categoria: 'asc' },
                { nome: 'asc' }
            ]
        })

        // Convert Decimal to number pra evitar problemas em Client Components
        const serialized = produtos.map(p => ({
            ...p,
            preco: Number(p.preco)
        }))

        return { data: serialized }
    } catch (err) {
        return { error: 'Falha ao buscar a lista de produtos e serviços.' }
    }
}

export async function createProduto(formData: FormData) {
    try {
        const { pousadaId } = await requireAuth()

        const nome = formData.get('nome') as string
        const descricao = formData.get('descricao') as string | null
        const precoStr = formData.get('preco') as string
        const categoria = formData.get('categoria') as any
        const estoqueStr = formData.get('estoque') as string | null

        if (!nome || !precoStr || !categoria) {
            return { error: 'Preencha todos os campos obrigatórios.' }
        }

        const preco = parseFloat(precoStr.replace(',', '.'))
        if (isNaN(preco) || preco < 0) {
            return { error: 'Preço inválido.' }
        }

        const estoque = estoqueStr ? parseInt(estoqueStr, 10) : null

        await prisma.produtoServico.create({
            data: {
                pousadaId,
                nome,
                descricao,
                preco,
                categoria,
                estoque,
                ativo: true
            }
        })

        revalidatePath('/dashboard/produtos')
        return { success: 'Produto cadastrado com sucesso!' }
    } catch (err) {
        return { error: 'Erro ao cadastrar o produto ou serviço.' }
    }
}

export async function updateProduto(id: string, formData: FormData) {
    try {
        const { pousadaId } = await requireAuth()

        // Validar posse do objeto
        const existing = await prisma.produtoServico.findUnique({ where: { id } })
        if (!existing || existing.pousadaId !== pousadaId) {
            return { error: 'Produto não encontrado ou acesso restrito.' }
        }

        const nome = formData.get('nome') as string
        const descricao = formData.get('descricao') as string | null
        const precoStr = formData.get('preco') as string
        const categoria = formData.get('categoria') as any
        const estoqueStr = formData.get('estoque') as string | null

        if (!nome || !precoStr || !categoria) {
            return { error: 'Preencha todos os campos obrigatórios.' }
        }

        const preco = parseFloat(precoStr.replace(',', '.'))
        if (isNaN(preco) || preco < 0) {
            return { error: 'Preço inválido.' }
        }

        const estoque = estoqueStr ? parseInt(estoqueStr, 10) : null

        await prisma.produtoServico.update({
            where: { id },
            data: {
                nome,
                descricao,
                preco,
                categoria,
                estoque
            }
        })

        revalidatePath('/dashboard/produtos')
        return { success: 'Produto atualizado com sucesso!' }
    } catch (err) {
        return { error: 'Erro ao atualizar o item.' }
    }
}

export async function toggleStatusProduto(id: string, ativoAtual: boolean) {
    try {
        const { pousadaId } = await requireAuth()

        const existing = await prisma.produtoServico.findUnique({ where: { id } })
        if (!existing || existing.pousadaId !== pousadaId) {
            return { error: 'Produto não encontrado.' }
        }

        await prisma.produtoServico.update({
            where: { id },
            data: { ativo: !ativoAtual }
        })

        revalidatePath('/dashboard/produtos')
        return { success: !ativoAtual ? 'Produto ativado!' : 'Produto desativado.' }
    } catch (err) {
        return { error: 'Falha ao alterar o status do produto.' }
    }
}

export async function deleteProduto(id: string) {
    try {
        const { pousadaId, perfil } = await requireAuth()

        if (perfil !== 'ADMIN') return { error: 'Apenas administradores podem excluir itens permanentemente.' }

        const existing = await prisma.produtoServico.findUnique({ where: { id } })
        if (!existing || existing.pousadaId !== pousadaId) {
            return { error: 'Produto não encontrado.' }
        }

        await prisma.produtoServico.delete({ where: { id } })

        revalidatePath('/dashboard/produtos')
        return { success: 'Item apagado com sucesso do catálogo.' }
    } catch (err) {
        return { error: 'Erro ao excluir o produto.' }
    }
}
