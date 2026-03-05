import { Skeleton } from "@/components/ui/skeleton"

export default function TarefasLoading() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-36" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, column) => (
                    <div key={column} className="rounded-lg border bg-card space-y-3 p-3">
                        <Skeleton className="h-5 w-24" />
                        {Array.from({ length: 3 }).map((_, item) => (
                            <div key={item} className="rounded border bg-background p-3 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-3/4" />
                                <div className="flex justify-between pt-1">
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                    <Skeleton className="h-6 w-6 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
