import AjudaClient from './ajuda-client'

export const metadata = { title: 'Ajuda - SmartInn' }

export default function AjudaPage() {
    return (
        <div className="flex-1 space-y-4">
            <div>
                <h2 className="text-xl md:text-3xl font-bold tracking-tight">Central de Ajuda</h2>
                <p className="text-muted-foreground mt-1 text-sm">Tutoriais, dúvidas frequentes e suporte.</p>
            </div>
            <AjudaClient />
        </div>
    )
}
