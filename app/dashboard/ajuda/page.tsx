import { HelpCircle } from 'lucide-react'

export const metadata = {
    title: 'Ajuda - SmartInn',
}

export default function AjudaPage() {
    return (
        <div className="flex-1 space-y-4">
            <div>
                <h2 className="text-xl md:text-3xl font-bold tracking-tight">Ajuda</h2>
                <p className="text-muted-foreground mt-1 text-sm">Tutoriais, dúvidas frequentes e suporte.</p>
            </div>
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
                <HelpCircle className="h-16 w-16 text-muted-foreground/30" />
                <div>
                    <p className="text-lg font-semibold">Em breve</p>
                    <p className="text-sm text-muted-foreground mt-1">A central de ajuda está em desenvolvimento.</p>
                </div>
            </div>
        </div>
    )
}
