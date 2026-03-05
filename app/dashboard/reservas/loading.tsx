import { Skeleton } from "@/components/ui/skeleton"

export default function ReservasLoading() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-9 w-36" />
            </div>

            {/* Tabs skeleton */}
            <div className="flex gap-2 border-b pb-1">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
            </div>

            {/* Table skeleton */}
            <div className="rounded-lg border bg-card">
                <div className="p-4 border-b">
                    <Skeleton className="h-5 w-48" />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-40 flex-1" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}
