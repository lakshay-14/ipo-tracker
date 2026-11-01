import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusDot, segmentLabel } from "@/components/status";
import {
  type Ipo,
  formatDate,
  formatIssueSize,
  formatPriceBand,
  formatRupees,
  minInvestment,
  todayInIndia,
} from "@/lib/format";
import { getIpo } from "@/lib/ipos";

export default async function IpoPage({ params }: PageProps<"/ipo/[id]">) {
  const { id } = await params;
  const ipo = await getIpo(id);
  if (!ipo) notFound();

  return (
    <div>
      <Link
        href="/"
        className="-ml-2 inline-flex h-9 items-center rounded-lg px-2 text-sm text-muted transition-colors duration-150 hover:bg-subtle hover:text-foreground"
      >
        ← All IPOs
      </Link>

      {/* Header */}
      <div className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{ipo.company_name}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-muted">
          <StatusDot status={ipo.status} />
          <span aria-hidden>·</span>
          <span>{segmentLabel(ipo.segment)}</span>
        </div>
      </div>

      {/* Key facts */}
      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Fact label="Price band" value={formatPriceBand(ipo)} />
        <Fact label="Lot size" value={ipo.lot_size ? `${ipo.lot_size} shares` : "—"} />
        <Fact label="Issue size" value={formatIssueSize(ipo.issue_size_cr)} />
        <Fact label="Minimum investment" value={formatRupees(minInvestment(ipo))} />
      </dl>
      {/* GMP has no data source yet. Hide the line until it does. */}
      {ipo.gmp != null && (
        <p className="mt-3 text-sm text-muted">
          GMP <span className="font-medium tabular-nums text-foreground">{formatRupees(ipo.gmp)}</span>
          {ipo.gmp_updated_at && ` · updated ${formatDate(ipo.gmp_updated_at.slice(0, 10))}`}
          {" · "}unofficial, can change quickly
        </p>
      )}

      {/* Timeline */}
      <Section title="Timeline">
        <Timeline ipo={ipo} />
      </Section>

      <BusinessSections ipo={ipo} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1.5 text-lg font-medium tabular-nums tracking-tight">{value}</dd>
    </div>
  );
}

// ---------- Timeline ----------

// Which step is happening now: 0 open, 1 closed, 2 allotment, 3 listed.
// -1 means the IPO has not opened yet.
function currentStage(ipo: Ipo) {
  switch (ipo.status) {
    case "upcoming":
      return -1;
    case "open":
      return 0;
    case "closed":
      return ipo.allotment_date && todayInIndia() >= ipo.allotment_date ? 2 : 1;
    case "listed":
      return 3;
  }
}

function Timeline({ ipo }: { ipo: Ipo }) {
  const steps = [
    { label: "Opens", date: ipo.open_date },
    { label: "Closes", date: ipo.close_date },
    { label: "Allotment", date: ipo.allotment_date },
    { label: "Listing", date: ipo.listing_date },
  ];
  const current = currentStage(ipo);

  return (
    <ol className="rounded-xl border border-line bg-surface p-5 sm:grid sm:grid-cols-4">
      {steps.map((step, i) => {
        const isCurrent = i === current;
        const isDone = i < current;
        const isLast = i === steps.length - 1;
        return (
          <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0 sm:block sm:pb-0 sm:pr-4">
            {/* Connector line: vertical on phones, horizontal on larger screens */}
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-[5px] top-4 bottom-0 w-px sm:left-4 sm:right-0 sm:top-[5px] sm:bottom-auto sm:h-px sm:w-auto ${
                  isDone ? "bg-muted" : "bg-line"
                }`}
              />
            )}
            <span
              aria-hidden
              className={`relative mt-1 size-[11px] shrink-0 rounded-full sm:mt-0 sm:block ${
                isCurrent
                  ? "bg-accent ring-4 ring-accent-soft"
                  : isDone
                    ? "bg-muted"
                    : "border border-line-strong bg-surface"
              }`}
            />
            <div className="sm:mt-3">
              <p className={`text-sm ${isCurrent ? "font-medium text-accent" : isDone ? "text-foreground" : "text-muted"}`}>
                {step.label}
                {isCurrent && <span className="sr-only"> (current stage)</span>}
              </p>
              <p className="mt-0.5 text-sm tabular-nums text-muted">{formatDate(step.date)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- About the business, Positives, Risks ----------

function cleanList(items: string[] | null | undefined) {
  return (items ?? []).map((item) => item.trim()).filter(Boolean);
}

function BusinessSections({ ipo }: { ipo: Ipo }) {
  const summary = ipo.business_summary?.trim();
  const strengths = cleanList(ipo.strengths);
  const risks = cleanList(ipo.risks);
  const hasAny = Boolean(summary) || strengths.length > 0 || risks.length > 0;

  return (
    <>
      {!hasAny && (
        <p className="mt-10 rounded-xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
          Business summary coming soon
        </p>
      )}

      {summary && (
        <Section title="About the business">
          <p className="max-w-3xl text-[15px] leading-relaxed">{summary}</p>
        </Section>
      )}

      {(strengths.length > 0 || risks.length > 0) && (
        <div className="grid gap-x-10 md:grid-cols-2">
          {strengths.length > 0 && (
            <Section title="Positives">
              <BulletList items={strengths} dot="bg-emerald-500" />
            </Section>
          )}
          {risks.length > 0 && (
            <Section title="Risks">
              <BulletList items={risks} dot="bg-amber-500" />
            </Section>
          )}
        </div>
      )}

      <p className="mt-10 border-t border-line pt-5 text-sm text-muted">
        Summary may contain errors. Not investment advice. Read the official RHP before
        investing.
      </p>
    </>
  );
}

function BulletList({ items, dot }: { items: string[]; dot: string }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
          <span aria-hidden className={`mt-[9px] size-1.5 shrink-0 rounded-full ${dot}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}
