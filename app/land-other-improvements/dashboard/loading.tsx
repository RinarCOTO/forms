import { PageShellSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function LandDashboardLoading() {
  return (
    <PageShellSkeleton breadcrumbs={3}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <TableSkeleton rows={10} cols={5} />
    </PageShellSkeleton>
  );
}
