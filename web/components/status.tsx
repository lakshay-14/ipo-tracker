import type { Ipo } from "@/lib/format";

// Soft status dots: green = Open, amber = Upcoming, gray = Closed/Listed.
const STATUS: Record<Ipo["status"], { label: string; dot: string }> = {
  open: { label: "Open", dot: "bg-emerald-500" },
  upcoming: { label: "Upcoming", dot: "bg-amber-500" },
  closed: { label: "Closed", dot: "bg-zinc-400 dark:bg-zinc-500" },
  listed: { label: "Listed", dot: "bg-zinc-400 dark:bg-zinc-500" },
};

export function StatusDot({ status }: { status: Ipo["status"] }) {
  const { label, dot } = STATUS[status];
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

export function segmentLabel(segment: Ipo["segment"]) {
  return segment === "sme" ? "SME" : "Mainboard";
}
