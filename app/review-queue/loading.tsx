import { PageShellSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewQueueLoading() {
  return (
    <PageShellSkeleton breadcrumbs={2}>
      <StatCardsSkeleton count={3} />

      {/* Card with filters + table */}
      <div className="rounded-xl border bg-card">
        <div className="p-6 space-y-4 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
          {/* Filter selects */}
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-9 w-44 rounded-md" />
              </div>
            ))}
          </div>
        </div>
        <div className="p-6">
          <TableSkeleton rows={8} cols={6} />
        </div>
      </div>
    </PageShellSkeleton>
  );
}
