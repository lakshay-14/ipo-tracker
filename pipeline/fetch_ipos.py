"""Load sample IPOs into Supabase. No scraping yet."""

from datetime import datetime, timezone
from pathlib import Path
import os

from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

NOW = datetime.now(timezone.utc).isoformat()

# Fake sample data for the first pipeline run.
SAMPLE_IPOS = [
    {
        "company_name": "Narmada Power Limited",
        "segment": "mainboard",
        "status": "open",
        "open_date": "2026-10-28",
        "close_date": "2026-10-30",
        "allotment_date": "2026-11-03",
        "listing_date": "2026-11-06",
        "price_band_low": 142,
        "price_band_high": 150,
        "lot_size": 100,
        "issue_size_cr": 1250.5,
        "gmp": 28,
        "gmp_updated_at": NOW,
        "updated_at": NOW,
    },
    {
        "company_name": "Kaveri Foods Limited",
        "segment": "sme",
        "status": "upcoming",
        "open_date": "2026-11-10",
        "close_date": "2026-11-12",
        "allotment_date": "2026-11-17",
        "listing_date": "2026-11-20",
        "price_band_low": 86,
        "price_band_high": 90,
        "lot_size": 160,
        "issue_size_cr": 74.2,
        "gmp": 12,
        "gmp_updated_at": NOW,
        "updated_at": NOW,
    },
    {
        "company_name": "Deccan Logistics Limited",
        "segment": "mainboard",
        "status": "closed",
        "open_date": "2026-10-20",
        "close_date": "2026-10-22",
        "allotment_date": "2026-10-27",
        "listing_date": "2026-10-31",
        "price_band_low": 210,
        "price_band_high": 221,
        "lot_size": 67,
        "issue_size_cr": 980,
        "gmp": 45,
        "gmp_updated_at": NOW,
        "updated_at": NOW,
    },
]


def main():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SECRET_KEY")
    if not url or not key:
        raise SystemExit("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env")
    if "supabase.com/dashboard" in url:
        raise SystemExit(
            "SUPABASE_URL should be https://<project-ref>.supabase.co "
            "(Project Settings → API), not the dashboard page URL."
        )

    client = create_client(url, key)
    result = (
        client.table("ipos")
        .upsert(SAMPLE_IPOS, on_conflict="company_name")
        .execute()
    )
    saved = len(result.data or [])
    print(f"Saved {saved} IPO rows.")


if __name__ == "__main__":
    main()
