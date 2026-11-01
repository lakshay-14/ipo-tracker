"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusDot, segmentLabel } from "@/components/status";
import { type Ipo, formatDate, formatPriceBand } from "@/lib/format";

const TABS = [
  { key: "open", label: "Open" },
  { key: "upcoming", label: "Upcoming" },
  { key: "closed", label: "Closed" },
] as const;

const SEGMENTS = [
  { key: "all", label: "All" },
  { key: "mainboard", label: "Mainboard" },
  { key: "sme", label: "SME" },
] as const;

type Tab = (typeof TABS)[number]["key"];
type Segment = (typeof SEGMENTS)[number]["key"];

// "Closed" tab also shows IPOs that have already listed.
function inTab(ipo: Ipo, tab: Tab) {
  if (tab === "closed") return ipo.status === "closed" || ipo.status === "listed";
  return ipo.status === tab;
}

export default function IpoList({ ipos }: { ipos: Ipo[] }) {
  const [tab, setTab] = useState<Tab>("open");
  const [segment, setSegment] = useState<Segment>("all");

  const shown = ipos.filter(
    (ipo) => inTab(ipo, tab) && (segment === "all" || ipo.segment === segment),
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Open / Upcoming / Closed segmented control */}
        <div className="grid grid-cols-3 rounded-xl bg-subtle p-1 sm:w-[360px]">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-pressed={active}
                className={`h-10 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "bg-surface text-foreground ring-1 ring-line"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t.label}
                <span className="ml-1.5 tabular-nums text-muted">
                  {ipos.filter((ipo) => inTab(ipo, t.key)).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mainboard / SME filter */}
        <div className="flex gap-1.5">
          {SEGMENTS.map((s) => {
            const active = segment === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSegment(s.key)}
                aria-pressed={active}
                className={`h-9 rounded-lg border px-3 text-sm transition-colors duration-150 ${
                  active
                    ? "border-transparent bg-accent-soft font-medium text-accent"
                    : "border-line text-muted hover:border-line-strong hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line py-16 text-center text-sm text-muted">
          No IPOs here right now.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((ipo) => (
            <li key={ipo.id}>
              <IpoCard ipo={ipo} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IpoCard({ ipo }: { ipo: Ipo }) {
  const closeWord = ipo.status === "open" || ipo.status === "upcoming" ? "Closes" : "Closed";
  return (
    <Link
      href={`/ipo/${ipo.id}`}
      className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition-colors duration-150 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold leading-snug tracking-tight">{ipo.company_name}</h2>
        <StatusDot status={ipo.status} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4">
        <KeyNumber label="Price band" value={formatPriceBand(ipo)} />
        <KeyNumber label="Lot size" value={ipo.lot_size?.toString() ?? "—"} />
      </dl>

      <p className="mt-auto pt-5 text-sm text-muted">
        {segmentLabel(ipo.segment)} · {closeWord} {formatDate(ipo.close_date)}
      </p>
    </Link>
  );
}

function KeyNumber({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-medium tabular-nums tracking-tight">{value}</dd>
    </div>
  );
}
