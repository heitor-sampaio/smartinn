import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ThemeSync } from '@/components/theme-sync'
import prisma from '@/lib/prisma'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Valida a sessão no Layout, assim protegemos nativamente
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const dbUser: any = await prisma.usuario.findUnique({
        where: { supabaseId: user.id },
        include: { pousada: true }
    });

    const modoTema = dbUser?.pousada?.modoTema || 'system';

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] overflow-x-hidden">
            <ThemeSync forcedTheme={modoTema} />
            {/* Sidebar fixo para telas md+ */}
            <Sidebar />
            <div className="flex flex-col min-w-0">
                {/* Header no topo */}
                <Header email={user.email} />
                {/* Conteúdo dinâmico (páginas) */}
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-8 min-w-0 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
