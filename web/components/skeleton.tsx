// A soft gray placeholder block shown while data loads.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-subtle ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex justify-between gap-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-14" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="mt-5 h-4 w-1/2" />
    </div>
  );
}
