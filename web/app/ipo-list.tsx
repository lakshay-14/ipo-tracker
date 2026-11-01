"use client";

import Link from "next/link";
import { useState } from "react";
import {
  type Ipo,
  formatDateRange,
  formatIssueSize,
  formatPriceBand,
} from "@/lib/format";

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
      {/* Open / Upcoming / Closed tabs */}
      <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-1 text-sm font-medium">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md py-2 transition ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label} ({ipos.filter((ipo) => inTab(ipo, t.key)).length})
          </button>
        ))}
      </div>

      {/* Mainboard / SME filter */}
      <div className="mt-3 flex gap-2 text-sm">
        {SEGMENTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSegment(s.key)}
            className={`rounded-full border px-3 py-1 transition ${
              segment === s.key
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 text-slate-600 hover:border-slate-500"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-500">
          No IPOs here right now.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
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
  return (
    <Link
      href={`/ipo/${ipo.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold leading-snug text-slate-900">
          {ipo.company_name}
        </h2>
        <SegmentBadge segment={ipo.segment} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Field label="Price band" value={formatPriceBand(ipo)} />
        <Field label="Lot size" value={ipo.lot_size?.toString() ?? "—"} />
        <Field label="Issue size" value={formatIssueSize(ipo.issue_size_cr)} />
        <Field label="Dates" value={formatDateRange(ipo.open_date, ipo.close_date)} />
      </dl>
    </Link>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

export function SegmentBadge({ segment }: { segment: Ipo["segment"] }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
        segment === "sme"
          ? "bg-amber-100 text-amber-800"
          : "bg-sky-100 text-sky-800"
      }`}
    >
      {segment === "sme" ? "SME" : "Mainboard"}
    </span>
  );
}
