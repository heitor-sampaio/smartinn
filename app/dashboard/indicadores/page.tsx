import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getDashboardIndicators } from '@/actions/indicadores'
import { DashboardIndicators } from './indicadores-client'
import prisma from '@/lib/prisma'

export default async function IndicadoresPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const usuario = await prisma.usuario.findUnique({
        where: { supabaseId: user.id },
        include: { pousada: true }
    })

    const indicatorsData = await getDashboardIndicators()

    return (
        <div className="flex-1 space-y-4 p-3 md:p-8 pt-4 md:pt-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight">Central de Indicadores (BI)</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Análise de performance e saúde financeira da {usuario?.pousada?.nome || 'pousada'}.
                    </p>
                </div>
            </div>

            <DashboardIndicators data={indicatorsData} />
        </div>
    )
}
