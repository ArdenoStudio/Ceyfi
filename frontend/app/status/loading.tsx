import { Skeleton } from "@/components/ui/skeleton";

export default function StatusLoading() {
  return (
    <main className="min-h-screen" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading system status</span>
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-12 sm:py-16 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
