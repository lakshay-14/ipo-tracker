import { CardSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading IPOs">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      <Skeleton className="mt-8 h-12 w-full rounded-xl sm:w-[360px]" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
