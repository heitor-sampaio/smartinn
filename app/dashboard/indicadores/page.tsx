import { requireRole } from '@/lib/auth'
import { getDashboardIndicators } from '@/actions/indicadores'
import { DashboardIndicators } from './indicadores-client'
import prisma from '@/lib/prisma'

export default async function IndicadoresPage() {
    const { pousadaId } = await requireRole(['ADMIN'])

    const [indicatorsData, pousada] = await Promise.all([
        getDashboardIndicators(),
        prisma.pousada.findUnique({ where: { id: pousadaId }, select: { nome: true } }),
    ])

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight">Central de Indicadores (BI)</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Análise de performance e saúde financeira da {pousada?.nome || 'pousada'}.
                    </p>
                </div>
            </div>

            <DashboardIndicators data={indicatorsData} />
        </div>
    )
}
