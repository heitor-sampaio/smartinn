import { getAjustes } from '@/actions/configuracoes';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import LoginForm from './login-form';
import { Bebas_Neue } from 'next/font/google';
import Image from 'next/image';
import { ThemeSync } from '@/components/theme-sync';

const bebas = Bebas_Neue({ subsets: ['latin'], weight: ['400'] });

export default async function EquipeLoginPage({ params }: { params: { pousadaId: string } }) {

    // 1. Validar Pousada via Token/Slug (linkEquipe) e não mais pelo ID real
    const pousada: any = await prisma.pousada.findUnique({
        where: { linkEquipe: params.pousadaId },
        select: {
            id: true,
            nome: true,
            logoUrl: true,
            senhaEquipe: true,
            modoTema: true
        }
    });

    if (!pousada) {
        notFound();
    }

    if (!pousada.senhaEquipe) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 p-4 font-sans text-center">
                <div className="bg-white dark:bg-zinc-950 p-8 rounded-2xl shadow-sm border max-w-sm w-full">
                    <h1 className="text-xl font-bold text-destructive mb-2">Acesso Desativado</h1>
                    <p className="text-sm text-muted-foreground">O acesso da equipe não foi configurado para esta pousada.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 p-4 font-sans focus-visible:outline-none">
            <ThemeSync forcedTheme={pousada.modoTema} />
            <div className="bg-background p-6 rounded-2xl shadow-sm border max-w-sm w-full space-y-6">
                <div className="text-center space-y-2">
                    <h1 className={`text-4xl tracking-wider text-primary ${bebas.className}`}>
                        {pousada.nome}
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground">Painel Operacional</p>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-1 mb-4">
                    <span className="text-2xl">🧹</span>
                    <span className="text-xs font-semibold text-primary/80">Acesso Restrito à Equipe</span>
                </div>

                <LoginForm pousadaId={params.pousadaId} />
            </div>
        </div>
    );
}
