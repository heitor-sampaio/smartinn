import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Verifica se o usuário já existe
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { supabaseId: user.id }
        });

        if (usuarioExistente) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // Recuperar / Recriar
        // Criamos uma nova pousada genérica primeiro
        const novaPousada = await prisma.pousada.create({
            data: {
                nome: "Pousada Restaurada",
                email: user.email || "pousada@exemplo.com",
            }
        });

        // E um novo usuário ligado a ela
        await prisma.usuario.create({
            data: {
                supabaseId: user.id,
                email: user.email || "usuario@exemplo.com",
                nome: user.user_metadata?.first_name || "Admin",
                perfil: "ADMIN",
                pousadaId: novaPousada.id,
            }
        });

        return NextResponse.redirect(new URL('/dashboard/configuracoes?recovered=true', request.url));
    } catch (e: any) {
        return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 });
    }
}
