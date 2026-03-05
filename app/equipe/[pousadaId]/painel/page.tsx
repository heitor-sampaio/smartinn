import { getTarefasList } from '@/actions/tarefas';
import { logoutEquipe } from '@/actions/equipe';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { TarefasClient } from '@/app/dashboard/tarefas/tarefas-client';
import { Bebas_Neue } from 'next/font/google';
import Image from 'next/image';
import { ThemeSync } from '@/components/theme-sync';

const bebas = Bebas_Neue({ subsets: ['latin'], weight: ['400'] });

export default async function EquipePainelPage({ params }: { params: { pousadaId: string } }) {
    // 1. Validar Pousada
    const pousada: any = await prisma.pousada.findUnique({
        where: { linkEquipe: params.pousadaId },
        select: { id: true, nome: true, logoUrl: true, modoTema: true, senhaEquipe: true }
    });

    if (!pousada || !pousada.senhaEquipe) {
        notFound();
    }

    // 2. Validar Cookie
    const hasAuth = cookies().get(`equipe_auth_${params.pousadaId}`)?.value === 'true';
    if (!hasAuth) {
        redirect(`/equipe/${params.pousadaId}`);
    }

    // 3. Buscar Tarefas Pendentes
    const { data: tarefas, pousadaId: realPousadaId } = await getTarefasList(params.pousadaId);

    return (
        <div className="min-h-screen bg-muted/10 font-sans pb-20 focus-visible:outline-none">
            <ThemeSync forcedTheme={pousada.modoTema} />

            {/* Header Flutuante / Fixo no Topo */}
            <header className="bg-primary text-primary-foreground sticky top-0 z-10 shadow-sm border-b">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <div>
                        <h1 className={`text-2xl tracking-wide ${bebas.className}`}>{pousada.nome}</h1>
                        <p className="text-xs font-medium opacity-80 leading-none">Equipe Operacional</p>
                    </div>

                    <form action={async () => {
                        'use server';
                        await logoutEquipe(params.pousadaId);
                    }}>
                        <Button type="submit" variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/90">
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            </header>

            {/* Conteúdo (Lista de Tarefas) */}
            <main className="max-w-4xl mx-auto p-4 flex-1 overflow-hidden h-full">
                <TarefasClient
                    initialData={tarefas || []}
                    isEquipeMode={true}
                    pousadaId={realPousadaId || pousada.id}
                    linkEquipe={params.pousadaId}
                />
            </main>
        </div>
    );
}
