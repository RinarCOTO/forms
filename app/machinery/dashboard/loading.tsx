import { PageShellSkeleton } from "@/components/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function MachineryDashboardLoading() {
  return (
    <PageShellSkeleton breadcrumbs={2}>
      {/* Action bar: search + municipality filter + new submission */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border shadow-sm">
          <Skeleton className="h-9 w-56 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* Card */}
      <div className="rounded-xl border bg-card shadow-sm">
        {/* Card header */}
        <div className="px-6 py-5 border-b space-y-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-72 opacity-70" />
        </div>

        {/* Table */}
        <div className="px-6 pt-4">
          {/* Table header: ID, Owner Name, Municipality, Last Updated, Status, Actions */}
          <div className="grid grid-cols-6 gap-4 pb-3 border-b">
            {["w-8", "w-24", "w-28", "w-24", "w-20", "w-16"].map((w, i) => (
              <Skeleton key={i} className={`h-4 ${w}`} />
            ))}
          </div>

          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, r) => (
            <div
              key={r}
              className="grid grid-cols-6 gap-4 py-3 border-b last:border-0"
              style={{ opacity: 1 - r * 0.09 }}
            >
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-7 w-7 rounded-md ml-auto" />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </div>
    </PageShellSkeleton>
  );
}
