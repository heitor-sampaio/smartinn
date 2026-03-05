import { getAjustes } from '@/actions/configuracoes';
import ConfiguracoesClient from './configuracoes-client';

export default async function ConfiguracoesPage() {
    const settings = await getAjustes();

    return (
        <div className="flex-1 space-y-4 p-3 md:p-8 pt-4 md:pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-3xl font-bold tracking-tight">Configurações</h2>
            </div>

            {/* Client component passing the current settings */}
            <ConfiguracoesClient initialData={settings} />
        </div>
    );
}
