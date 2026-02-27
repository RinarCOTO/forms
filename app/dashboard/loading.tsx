import { PageShellSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <PageShellSkeleton breadcrumbs={1}>
      {/* Form type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-8 w-24 rounded-md mt-2" />
          </div>
        ))}
      </div>
      <StatCardsSkeleton count={3} />
      <TableSkeleton rows={6} cols={4} />
    </PageShellSkeleton>
  );
}
