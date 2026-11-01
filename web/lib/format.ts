// Shared types and display helpers. Safe to use in the browser.

// One row from the Supabase "ipos" table (see db/schema.sql).
export type Ipo = {
  id: string;
  company_name: string;
  segment: "mainboard" | "sme";
  status: "upcoming" | "open" | "closed" | "listed";
  open_date: string | null;
  close_date: string | null;
  allotment_date: string | null;
  listing_date: string | null;
  price_band_low: number | null;
  price_band_high: number | null;
  lot_size: number | null;
  issue_size_cr: number | null;
  gmp: number | null;
  gmp_updated_at: string | null;
  updated_at: string;
  // Not filled by the pipeline yet. Empty until the columns have data.
  business_summary?: string | null;
  strengths?: string[] | null;
  risks?: string[] | null;
};

const rupee = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function formatRupees(value: number | null) {
  return value == null ? "—" : `₹${rupee.format(value)}`;
}

export function formatPriceBand(ipo: Ipo) {
  const { price_band_low: low, price_band_high: high } = ipo;
  if (low == null && high == null) return "—";
  if (low == null || high == null || low === high) {
    return formatRupees(high ?? low);
  }
  return `${formatRupees(low)} – ${formatRupees(high)}`;
}

export function formatIssueSize(value: number | null) {
  return value == null ? "—" : `₹${rupee.format(value)} Cr`;
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  // Dates are plain "YYYY-MM-DD". Read them as UTC so the day never shifts.
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Minimum investment = one lot at the top of the price band.
export function minInvestment(ipo: Ipo) {
  if (ipo.lot_size == null || ipo.price_band_high == null) return null;
  return ipo.lot_size * ipo.price_band_high;
}
