import { DarkPageShellSkeleton } from "@/components/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageUsersLoading() {
  return (
    <DarkPageShellSkeleton breadcrumbs={2}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 bg-zinc-800" />
          <Skeleton className="h-4 w-56 bg-zinc-800" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md bg-zinc-800" />
      </div>

      {/* Dark table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex gap-4 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-4 flex-1 bg-zinc-700" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3 border-b border-zinc-800 last:border-0">
            {[1, 2, 3, 4, 5, 6].map((c) => (
              <Skeleton key={c} className="h-4 flex-1 bg-zinc-800" style={{ opacity: 1 - r * 0.08 }} />
            ))}
          </div>
        ))}
      </div>
    </DarkPageShellSkeleton>
  );
}
