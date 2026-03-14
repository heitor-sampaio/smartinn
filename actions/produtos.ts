'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'

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
            preco: Number(p.preco),
            custo: p.custo !== null ? Number(p.custo) : null
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
        const custoStr = formData.get('custo') as string | null
        const categoria = formData.get('categoria') as any
        const estoqueStr = formData.get('estoque') as string | null

        if (!nome || !precoStr || !categoria) {
            return { error: 'Preencha todos os campos obrigatórios.' }
        }

        const preco = parseFloat(precoStr.replace(',', '.'))
        if (isNaN(preco) || preco < 0) {
            return { error: 'Preço inválido.' }
        }

        const custo = custoStr && custoStr !== '' ? parseFloat(custoStr.replace(',', '.')) : null
        const estoque = estoqueStr && estoqueStr !== '' ? parseInt(estoqueStr, 10) : null

        await prisma.produtoServico.create({
            data: {
                pousadaId,
                nome,
                descricao,
                preco,
                custo,
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

        const nome = formData.get('nome') as string
        const descricao = formData.get('descricao') as string | null
        const precoStr = formData.get('preco') as string
        const custoStr = formData.get('custo') as string | null
        const categoria = formData.get('categoria') as any
        const estoqueStr = formData.get('estoque') as string | null

        if (!nome || !precoStr || !categoria) {
            return { error: 'Preencha todos os campos obrigatórios.' }
        }

        const preco = parseFloat(precoStr.replace(',', '.'))
        if (isNaN(preco) || preco < 0) {
            return { error: 'Preço inválido.' }
        }

        const custo = custoStr && custoStr !== '' ? parseFloat(custoStr.replace(',', '.')) : null
        const estoque = estoqueStr && estoqueStr !== '' ? parseInt(estoqueStr, 10) : null

        await prisma.produtoServico.update({
            where: { id, pousadaId },
            data: {
                nome,
                descricao,
                preco,
                custo,
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

        await prisma.produtoServico.update({
            where: { id, pousadaId },
            data: { ativo: !ativoAtual }
        })

        revalidatePath('/dashboard/produtos')
        return { success: !ativoAtual ? 'Produto ativado!' : 'Produto desativado.' }
    } catch (err) {
        return { error: 'Falha ao alterar o status do produto.' }
    }
}

export async function ajustarEstoque(id: string, novoEstoque: number) {
    try {
        const { pousadaId } = await requireAuth()

        if (novoEstoque < 0) return { error: 'Estoque não pode ser negativo.' }

        await prisma.produtoServico.update({
            where: { id, pousadaId },
            data: { estoque: novoEstoque }
        })

        revalidatePath('/dashboard/produtos')
        return { success: `Estoque atualizado para ${novoEstoque} unidades.` }
    } catch (err) {
        return { error: 'Erro ao ajustar o estoque.' }
    }
}

export async function deleteProduto(id: string) {
    try {
        const { pousadaId, perfil } = await requireAuth()

        if (perfil !== 'ADMIN') return { error: 'Apenas administradores podem excluir itens permanentemente.' }

        await prisma.produtoServico.delete({ where: { id, pousadaId } })

        revalidatePath('/dashboard/produtos')
        return { success: 'Item apagado com sucesso do catálogo.' }
    } catch (err) {
        return { error: 'Erro ao excluir o produto.' }
    }
}
