import { DarkPageShellSkeleton } from "@/components/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageRolesLoading() {
  // 9 roles, shown as column headers
  const roles = 9;
  // 8 feature groups
  const modules = 8;

  return (
    <DarkPageShellSkeleton breadcrumbs={2}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-64 bg-zinc-800" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md bg-zinc-800" />
          <Skeleton className="h-9 w-20 rounded-md bg-zinc-800" />
        </div>
      </div>

      {/* Permission matrix table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {/* Role header row */}
        <div className="flex gap-2 px-4 py-3 bg-zinc-900/80 border-b border-zinc-800">
          <Skeleton className="h-4 w-40 bg-zinc-700 shrink-0" />
          {Array.from({ length: roles }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-10 bg-zinc-700 rounded-full shrink-0" />
          ))}
        </div>

        {/* Feature rows grouped by module */}
        {Array.from({ length: modules }).map((_, g) => (
          <div key={g}>
            {/* Module header */}
            <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-800">
              <Skeleton className="h-4 w-36 bg-zinc-700" />
            </div>
            {/* 3–4 feature rows per module */}
            {Array.from({ length: g === 3 || g === 6 ? 1 : 4 }).map((_, r) => (
              <div key={r} className="flex gap-2 items-center px-4 py-3 border-b border-zinc-800/60 last:border-0">
                <Skeleton className="h-4 w-40 bg-zinc-800 shrink-0" />
                {Array.from({ length: roles }).map((_, c) => (
                  <Skeleton key={c} className="h-8 w-8 rounded-full bg-zinc-800 shrink-0" />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </DarkPageShellSkeleton>
  );
}
