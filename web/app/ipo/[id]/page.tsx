import Link from "next/link";
import { notFound } from "next/navigation";
import {
  type Ipo,
  formatDate,
  formatIssueSize,
  formatPriceBand,
  formatRupees,
  minInvestment,
} from "@/lib/format";
import { getIpo } from "@/lib/ipos";
import { SegmentBadge } from "../../ipo-list";

const STATUS_LABEL: Record<Ipo["status"], string> = {
  upcoming: "Upcoming",
  open: "Open now",
  closed: "Closed",
  listed: "Listed",
};

export default async function IpoPage({ params }: PageProps<"/ipo/[id]">) {
  const { id } = await params;
  const ipo = await getIpo(id);
  if (!ipo) notFound();

  return (
    <div>
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
        ← All IPOs
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900">{ipo.company_name}</h1>
        <SegmentBadge segment={ipo.segment} />
      </div>
      <p className="mt-1 text-sm text-slate-500">{STATUS_LABEL[ipo.status]}</p>

      <Section title="Issue details">
        <Row label="Price band" value={formatPriceBand(ipo)} />
        <Row label="Lot size" value={ipo.lot_size ? `${ipo.lot_size} shares` : "—"} />
        <Row label="Minimum investment" value={formatRupees(minInvestment(ipo))} />
        <Row label="Issue size" value={formatIssueSize(ipo.issue_size_cr)} />
      </Section>

      <Section title="Key dates">
        <Row label="Opens" value={formatDate(ipo.open_date)} />
        <Row label="Closes" value={formatDate(ipo.close_date)} />
        <Row label="Allotment" value={formatDate(ipo.allotment_date)} />
        <Row label="Listing" value={formatDate(ipo.listing_date)} />
      </Section>

      <Section title="Grey market premium (GMP)">
        <Row label="GMP" value={formatRupees(ipo.gmp)} />
        <Row
          label="GMP updated"
          value={ipo.gmp_updated_at ? formatDate(ipo.gmp_updated_at.slice(0, 10)) : "—"}
        />
        <p className="pt-2 text-xs text-slate-500">
          GMP is unofficial and can change quickly. It does not predict the
          listing price.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-2 font-semibold text-slate-900">{title}</h2>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
