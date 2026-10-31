"""Fetch current and upcoming IPOs from Chittorgarh and upsert into Supabase.

Does not fetch GMP. If parsing fails, nothing is written to the database.
"""

from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urljoin
import os
import re
import sys
import time

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

BASE_URL = "https://www.chittorgarh.com"
LIST_URL = f"{BASE_URL}/"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)
REQUEST_GAP_SECONDS = 2

LIST_HEADINGS = {
    "mainboard ipos & fpos": "mainboard",
    "sme ipos & fpos": "sme",
    "upcoming mainboard ipos (filed)": "mainboard",
    "upcoming mainboard ipos (approved)": "mainboard",
}


class ParseError(Exception):
    """Raised when the Chittorgarh page layout cannot be read."""


def fetch_html(session, url):
    time.sleep(REQUEST_GAP_SECONDS)
    response = session.get(url, timeout=30)
    response.raise_for_status()
    return response.text


def parse_date(text):
    text = (text or "").strip()
    if not text or text in {"-", "NA", "N/A", "TBA"}:
        return None
    text = re.sub(r"\s+T$", "", text).strip()
    for fmt in ("%a, %b %d, %Y", "%B %d, %Y", "%b %d, %Y", "%d %b %Y"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    raise ParseError(f"Could not parse date: {text!r}")


def parse_number(text):
    if not text:
        return None
    cleaned = text.replace(",", "").replace("₹", "").strip()
    match = re.search(r"(\d+(?:\.\d+)?)", cleaned)
    if not match:
        return None
    return float(match.group(1))


def parse_price_band(text):
    text = (text or "").replace(",", "")
    nums = re.findall(r"(\d+(?:\.\d+)?)", text)
    if len(nums) >= 2:
        return float(nums[0]), float(nums[1])
    if len(nums) == 1:
        value = float(nums[0])
        return value, value
    return None, None


def parse_issue_size_cr(text):
    text = text or ""
    match = re.search(r"₹\s*([\d,.]+)\s*Cr", text, re.I)
    if match:
        return float(match.group(1).replace(",", ""))
    return None


def table_map(soup):
    values = {}
    for row in soup.find_all("tr"):
        cells = [c.get_text(" ", strip=True) for c in row.find_all(["th", "td"])]
        if len(cells) >= 2:
            values[cells[0].lower()] = cells[1]
    return values


def status_from_dates(open_date, close_date, listing_date):
    today = date.today()

    def as_date(value):
        return date.fromisoformat(value) if value else None

    listing = as_date(listing_date)
    close = as_date(close_date)
    open_ = as_date(open_date)
    if listing and listing <= today:
        return "listed"
    if close and close < today:
        return "closed"
    if open_ and open_ <= today:
        return "open"
    return "upcoming"


def parse_list_page(html):
    soup = BeautifulSoup(html, "html.parser")
    found = []
    seen = set()
    matched_headings = set()

    for table in soup.find_all("table"):
        heading = table.find_previous(["h2", "h3"])
        if not heading:
            continue
        heading_text = heading.get_text(" ", strip=True).lower()
        segment = None
        for prefix, value in LIST_HEADINGS.items():
            if heading_text.startswith(prefix):
                segment = value
                matched_headings.add(prefix)
                break
        if not segment:
            continue

        headers = [th.get_text(" ", strip=True).lower() for th in table.find_all("th")]
        if "company" not in headers:
            raise ParseError(
                f"Chittorgarh list table '{heading_text}' is missing a Company column."
            )

        for row in table.find_all("tr"):
            link = row.find("a", href=True)
            if not link:
                continue
            href = link["href"]
            if "/ipo/" not in href:
                continue
            url = urljoin(BASE_URL, href)
            if url in seen:
                continue
            seen.add(url)
            found.append({"url": url, "segment": segment})

    if "mainboard ipos & fpos" not in matched_headings:
        raise ParseError("Could not find the Mainboard IPOs table on the Chittorgarh home page.")
    if "sme ipos & fpos" not in matched_headings:
        raise ParseError("Could not find the SME IPOs table on the Chittorgarh home page.")
    if not found:
        raise ParseError("Chittorgarh list page had no IPO links. Layout may have changed.")
    return found


def parse_detail_page(html, segment, url):
    soup = BeautifulSoup(html, "html.parser")
    heading = soup.find("h1")
    if not heading:
        raise ParseError(f"Missing company heading on {url}")

    company_name = heading.get_text(" ", strip=True)
    company_name = re.sub(r"\s+IPO Details$", "", company_name, flags=re.I)
    company_name = re.sub(r"\s+IPO$", "", company_name, flags=re.I).strip()
    if not company_name:
        raise ParseError(f"Blank company name on {url}")

    dates = {}
    ratios = soup.select_one("ul.top-ratios")
    if ratios:
        for item in ratios.find_all("li"):
            spans = item.find_all("span")
            if len(spans) < 2:
                continue
            label = spans[0].get_text(" ", strip=True).lower()
            value = spans[-1].get_text(" ", strip=True)
            dates[label] = value

    details = table_map(soup)
    open_date = parse_date(dates.get("ipo open"))
    close_date = parse_date(dates.get("ipo close"))
    allotment_date = parse_date(dates.get("allotment"))
    listing_date = parse_date(dates.get("listing"))
    low, high = parse_price_band(details.get("price band", ""))
    lot_size = parse_number(details.get("lot size", ""))
    issue_size_cr = parse_issue_size_cr(details.get("total issue size", ""))

    if not any([open_date, close_date, listing_date, low, lot_size, issue_size_cr]):
        raise ParseError(f"Could not read IPO details on {url}. Layout may have changed.")

    now = datetime.now(timezone.utc).isoformat()
    return {
        "company_name": company_name,
        "segment": segment,
        "status": status_from_dates(open_date, close_date, listing_date),
        "open_date": open_date,
        "close_date": close_date,
        "allotment_date": allotment_date,
        "listing_date": listing_date,
        "price_band_low": low,
        "price_band_high": high,
        "lot_size": int(lot_size) if lot_size is not None else None,
        "issue_size_cr": issue_size_cr,
        "updated_at": now,
    }


def load_ipos(session):
    list_html = fetch_html(session, LIST_URL)
    listed = parse_list_page(list_html)
    rows = []
    for item in listed:
        detail_html = fetch_html(session, item["url"])
        rows.append(parse_detail_page(detail_html, item["segment"], item["url"]))
    return rows


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

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    try:
        rows = load_ipos(session)
    except ParseError as exc:
        print(f"Parse error: {exc}", file=sys.stderr)
        print("Database was not changed.", file=sys.stderr)
        raise SystemExit(1) from exc
    except requests.RequestException as exc:
        print(f"Could not fetch Chittorgarh: {exc}", file=sys.stderr)
        print("Database was not changed.", file=sys.stderr)
        raise SystemExit(1) from exc

    client = create_client(url, key)
    result = client.table("ipos").upsert(rows, on_conflict="company_name").execute()
    saved = len(result.data or [])
    print(f"Saved {saved} IPO rows.")


if __name__ == "__main__":
    main()
