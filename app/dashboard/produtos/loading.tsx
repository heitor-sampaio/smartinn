import { Skeleton } from "@/components/ui/skeleton"

export default function ProdutosLoading() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-44" />
                <Skeleton className="h-9 w-36" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <div className="flex gap-2 pt-1">
                            <Skeleton className="h-8 flex-1 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
