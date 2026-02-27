import { Skeleton } from "@/components/ui/skeleton";

// ─── Sidebar skeleton ─────────────────────────────────────────────────────────

export function SidebarSkeleton() {
  return (
    <div className="w-64 shrink-0 border-r bg-sidebar h-screen flex flex-col gap-4 p-4">
      <div className="space-y-1 pb-2 border-b">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-40" />
      </div>
      {[1, 2, 3].map((g) => (
        <div key={g} className="space-y-2">
          <Skeleton className="h-3 w-20 opacity-60" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      ))}
      <div className="mt-auto pt-2 border-t">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

// ─── Header skeleton ──────────────────────────────────────────────────────────

export function HeaderSkeleton({ breadcrumbs = 2 }: { breadcrumbs?: number }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
      <Skeleton className="h-6 w-6 rounded" />
      <div className="w-px h-4 bg-border mx-1" />
      <div className="flex items-center gap-2">
        {Array.from({ length: breadcrumbs }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            {i < breadcrumbs - 1 && <span className="text-muted-foreground text-xs">/</span>}
          </div>
        ))}
      </div>
    </header>
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-md border overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-muted/40 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3 border-b last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" style={{ opacity: 1 - r * 0.08 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Stats cards skeleton ─────────────────────────────────────────────────────

export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  );
}

// ─── Full page shell (light) ──────────────────────────────────────────────────

interface PageShellSkeletonProps {
  breadcrumbs?: number;
  children: React.ReactNode;
}

export function PageShellSkeleton({ breadcrumbs = 2, children }: PageShellSkeletonProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarSkeleton />
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderSkeleton breadcrumbs={breadcrumbs} />
        <div className="flex-1 p-6 overflow-y-auto space-y-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Full page shell (dark) ───────────────────────────────────────────────────

export function DarkPageShellSkeleton({ breadcrumbs = 2, children }: PageShellSkeletonProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950">
      {/* Dark sidebar */}
      <div className="w-64 shrink-0 border-r border-zinc-800 h-screen flex flex-col gap-4 p-4">
        <div className="space-y-1 pb-2 border-b border-zinc-800">
          <Skeleton className="h-5 w-24 bg-zinc-800" />
          <Skeleton className="h-3 w-40 bg-zinc-800" />
        </div>
        {[1, 2, 3].map((g) => (
          <div key={g} className="space-y-2">
            <Skeleton className="h-3 w-20 bg-zinc-800 opacity-60" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md bg-zinc-800" />
            ))}
          </div>
        ))}
        <div className="mt-auto pt-2 border-t border-zinc-800">
          <Skeleton className="h-10 w-full rounded-md bg-zinc-800" />
        </div>
      </div>
      {/* Dark content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-800 px-4 bg-zinc-900">
          <Skeleton className="h-6 w-6 rounded bg-zinc-700" />
          <div className="w-px h-4 bg-zinc-700 mx-1" />
          <div className="flex items-center gap-2">
            {Array.from({ length: breadcrumbs }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-20 bg-zinc-700" />
                {i < breadcrumbs - 1 && <span className="text-zinc-600 text-xs">/</span>}
              </div>
            ))}
          </div>
        </header>
        <div className="flex-1 p-6 overflow-y-auto space-y-6">{children}</div>
      </div>
    </div>
  );
}
