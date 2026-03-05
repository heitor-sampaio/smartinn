import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-48" />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                <div className="lg:col-span-4 rounded-lg border bg-card p-4 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-[250px] w-full rounded" />
                </div>
                <div className="lg:col-span-3 rounded-lg border bg-card p-4 space-y-3">
                    <Skeleton className="h-5 w-36" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
