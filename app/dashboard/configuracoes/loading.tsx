import { Skeleton } from "@/components/ui/skeleton"

export default function ConfiguracoesLoading() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-40" />
            </div>

            {/* Tabs skeleton */}
            <div className="flex gap-2 border-b pb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-24" />
                ))}
            </div>

            {/* Form fields skeleton */}
            <div className="space-y-6 max-w-2xl">
                <div className="rounded-lg border bg-card p-6 space-y-4">
                    <Skeleton className="h-5 w-36 mb-2" />
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                    ))}
                </div>
                <Skeleton className="h-9 w-48 ml-auto" />
            </div>
        </div>
    )
}
