import { requireRole } from '@/lib/auth'
import { getAjustes } from '@/actions/configuracoes'
import { listarUsuarios } from '@/actions/usuarios'
import ConfiguracoesClient from './configuracoes-client'

export default async function ConfiguracoesPage() {
    await requireRole(['ADMIN'])

    const [settings, usuariosRes] = await Promise.all([
        getAjustes(),
        listarUsuarios(),
    ])

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight">Configurações</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Personalize as preferências e parâmetros da pousada.</p>
                </div>
            </div>

            <ConfiguracoesClient initialData={settings} initialUsuarios={usuariosRes.data ?? []} />
        </div>
    )
}
