import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { border, containerBg } from "@/styles/theme"

type DashboardShellSkeletonProps = {
  message?: string
}

export function DashboardShellSkeleton({ message }: DashboardShellSkeletonProps) {
  return (
    <div className={cn("flex min-h-screen", containerBg)}>
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 hidden h-screen w-64 flex-col gap-3 border-r p-4 md:flex",
          "border-sidebar-border bg-sidebar"
        )}
      >
        <Skeleton className="h-8 w-32 shrink-0 bg-sidebar-accent/40" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full shrink-0 rounded-md bg-sidebar-accent/30" />
        ))}
      </aside>

      <div className={cn("flex min-h-screen min-w-0 flex-1 flex-col md:ml-64", containerBg)}>
        <header
          className={cn(
            "flex h-14 shrink-0 items-center justify-between gap-4 border-b px-3 sm:px-4",
            border,
            containerBg
          )}
        >
          <Skeleton className="h-8 w-40 max-w-[45%] sm:w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <Skeleton className="hidden h-9 w-28 shrink-0 rounded-md sm:block" />
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-6 sm:pb-8">
          <div className={cn("mx-auto max-w-7xl space-y-6", containerBg)}>
            {message ? (
              <p className="text-sm text-muted-foreground">{message}</p>
            ) : null}
            <div className="space-y-2">
              <Skeleton className="h-9 w-56 max-w-full sm:h-10 sm:w-72" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg sm:h-36" />
              ))}
            </div>
          </div>
        </main>

        <div className={cn("w-full border-t", border)} />
        <div className="flex h-12 items-center px-4 sm:h-14">
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>
  )
}
