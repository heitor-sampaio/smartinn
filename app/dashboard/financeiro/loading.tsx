import { Skeleton } from "@/components/ui/skeleton"

export default function FinanceiroLoading() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-9 w-44" />
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-7 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                ))}
            </div>

            {/* Tabela de lançamentos */}
            <div className="rounded-lg border bg-card">
                <div className="p-4 border-b flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-9 w-36" />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}
