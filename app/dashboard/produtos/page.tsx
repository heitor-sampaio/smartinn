import { Metadata } from "next"
import { getProdutosList } from "@/actions/produtos"
import { getAcomodacoesCount } from "@/actions/acomodacoes"
import { ProdutosClient } from "./produtos-client"

export const metadata: Metadata = {
    title: "Produtos e Serviços | SmartInn",
    description: "Gerencie produtos, conveniência e serviços da sua pousada.",
}

export default async function ProdutosPage() {
    const [{ data: produtos, error }, { data: totalAcomodacoes }] = await Promise.all([
        getProdutosList(),
        getAcomodacoesCount(),
    ])

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight">Produtos e Serviços</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Adicione itens do frigobar, pratos do restaurante e passeios que serão ofertados aos seus clientes.
                    </p>
                </div>
            </div>

            {error ? (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                    <p>{error}</p>
                </div>
            ) : (
                <ProdutosClient initialData={produtos || []} totalAcomodacoes={totalAcomodacoes ?? 0} />
            )}
        </div>
    )
}
