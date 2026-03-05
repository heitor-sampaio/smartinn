import { Metadata } from "next"
import { getProdutosList } from "@/actions/produtos"
import { ProdutosClient } from "./produtos-client"

export const metadata: Metadata = {
    title: "Produtos e Serviços | PousadaApp",
    description: "Gerencie produtos, conveniência e serviços da sua pousada.",
}

export default async function ProdutosPage() {
    const { data: produtos, error } = await getProdutosList()

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Produtos e Serviços</h1>
                <p className="text-muted-foreground mt-2">
                    Adicione itens do frigobar, pratos do restaurante e passeios que serão ofertados aos seus clientes.
                </p>
            </div>

            {error ? (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                    <p>{error}</p>
                </div>
            ) : (
                <ProdutosClient initialData={produtos || []} />
            )}
        </div>
    )
}
