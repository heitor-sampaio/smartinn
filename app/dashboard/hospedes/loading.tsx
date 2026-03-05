import { Skeleton } from "@/components/ui/skeleton"

export default function HospedesLoading() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-36" />
            </div>

            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-64" />
            </div>

            <div className="rounded-lg border bg-card">
                <div className="p-4 border-b">
                    <Skeleton className="h-5 w-32" />
                </div>
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                        <Skeleton className="h-4 w-36 flex-1" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}
