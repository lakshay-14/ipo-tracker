import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading IPO">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="mt-6 h-9 w-72 max-w-full" />
      <Skeleton className="mt-4 h-5 w-40" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-10 h-4 w-24" />
      <Skeleton className="mt-3 h-28 rounded-xl" />
    </div>
  );
}
