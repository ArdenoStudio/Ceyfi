import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ChartSkeleton({
  height = 280,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <Skeleton
      className={cn("w-full rounded-xl", className)}
      style={{ height }}
      aria-hidden
    />
  );
}

export function CarouselSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-ceyfi-line/70 bg-ceyfi-paper/80 p-4 sm:p-6",
        className
      )}
      aria-hidden
    >
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-7 w-64 max-w-full" />
      <Skeleton className="mt-6 h-[220px] w-full rounded-2xl sm:h-[260px]" />
    </div>
  );
}

export function ConnectionDiagramSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-md px-2", className)} aria-hidden>
      <Skeleton className="mx-auto h-28 w-full max-w-sm rounded-2xl sm:h-32" />
      <Skeleton className="mx-auto mt-3 h-3 w-72 max-w-full" />
    </div>
  );
}
