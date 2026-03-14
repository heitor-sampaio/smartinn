import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ThemeSync } from '@/components/theme-sync'
import prisma from '@/lib/prisma'
import { getDashboardAlerts } from '@/actions/dashboard'

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

    const [dbUser, alerts] = await Promise.all([
        prisma.usuario.findUnique({ where: { supabaseId: user.id }, include: { pousada: true } }),
        getDashboardAlerts(),
    ])

    if (!dbUser?.ativo) {
        redirect('/login')
    }

    const modoTema = (dbUser as any)?.pousada?.modoTema || 'system';
    const perfil = dbUser?.perfil ?? 'RECEPCIONISTA'

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] overflow-x-hidden">
            <ThemeSync forcedTheme={modoTema} />
            {/* Sidebar fixo para telas md+ */}
            <Sidebar perfil={perfil} />
            <div className="flex flex-col min-w-0">
                {/* Header no topo */}
                <Header email={user.email} alerts={alerts} perfil={perfil} />
                {/* Conteúdo dinâmico (páginas) */}
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-8 min-w-0 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
