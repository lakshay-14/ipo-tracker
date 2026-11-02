"""Send daily Telegram alerts for IPOs that open, close, allot or list today (IST).

Each alert goes to every active subscriber once. Sent alerts are saved in
alerts_sent so a second run on the same day sends nothing new.

Usage:
  python pipeline/send_alerts.py                      # send for real
  python pipeline/send_alerts.py --dry-run            # print only, send and save nothing
  python pipeline/send_alerts.py --test-chat-id 123   # send only to this chat, save nothing
"""

from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import argparse
import os
import sys
import time

import requests
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

SITE_URL = "https://ipo-tracker-eta.vercel.app/"
TELEGRAM_API = "https://api.telegram.org"
MESSAGE_GAP_SECONDS = 0.1
IST = timezone(timedelta(hours=5, minutes=30))

# alert_type -> (ipos column, headline, date label)
ALERT_TYPES = {
    "open": ("open_date", "Opens today", "Opens"),
    "close": ("close_date", "Closes today", "Closes"),
    "allotment": ("allotment_date", "Allotment today", "Allotment"),
    "listing": ("listing_date", "Lists today", "Listing"),
}


def today_in_ist():
    return datetime.now(IST).date()


# ---------- Formatting ----------

def format_inr(value):
    """1250.5 -> "1,250.5", 1234567 -> "12,34,567" (Indian grouping)."""
    number = float(value)
    whole = int(number)
    fraction = f"{number - whole:.2f}"[1:].rstrip("0").rstrip(".")
    digits = str(whole)
    if len(digits) > 3:
        head, tail = digits[:-3], digits[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        digits = ",".join(groups + [tail])
    return digits + fraction


def format_price_band(ipo):
    low, high = ipo.get("price_band_low"), ipo.get("price_band_high")
    if low is None and high is None:
        return "Not announced"
    if low is None or high is None or low == high:
        return f"₹{format_inr(high if high is not None else low)}"
    return f"₹{format_inr(low)} – ₹{format_inr(high)}"


def format_date(value):
    day = date.fromisoformat(value)
    return f"{day.day} {day.strftime('%b %Y')}"


def build_message(ipo, alert_type):
    column, headline, date_label = ALERT_TYPES[alert_type]
    segment = "SME" if ipo.get("segment") == "sme" else "Mainboard"
    lot = f"{ipo['lot_size']} shares" if ipo.get("lot_size") else "Not announced"
    return (
        f"{headline}: {ipo['company_name']} ({segment})\n"
        f"\n"
        f"Price band: {format_price_band(ipo)}\n"
        f"Lot size: {lot}\n"
        f"{date_label}: {format_date(ipo[column])}\n"
        f"\n"
        f"{SITE_URL}\n"
        f"\n"
        f"Not investment advice."
    )


# ---------- Database ----------

def find_alerts(client, today):
    """Return [(ipo, alert_type)] for every key date that falls on today."""
    day = today.isoformat()
    columns = [column for column, _, _ in ALERT_TYPES.values()]
    result = (
        client.table("ipos")
        .select("*")
        .or_(",".join(f"{column}.eq.{day}" for column in columns))
        .execute()
    )
    alerts = []
    for ipo in result.data or []:
        for alert_type, (column, _, _) in ALERT_TYPES.items():
            if ipo.get(column) == day:
                alerts.append((ipo, alert_type))
    return alerts


def already_sent(client, today):
    """Return a set of (ipo_id, alert_type) already sent today."""
    result = (
        client.table("alerts_sent")
        .select("ipo_id, alert_type")
        .eq("alert_date", today.isoformat())
        .execute()
    )
    return {(row["ipo_id"], row["alert_type"]) for row in result.data or []}


def active_chat_ids(client):
    """All active subscribers, read 1000 rows at a time."""
    chat_ids, start, page = [], 0, 1000
    while True:
        result = (
            client.table("subscribers")
            .select("chat_id")
            .eq("active", True)
            .order("chat_id")
            .range(start, start + page - 1)
            .execute()
        )
        rows = result.data or []
        chat_ids.extend(row["chat_id"] for row in rows)
        if len(rows) < page:
            return chat_ids
        start += page


def deactivate(client, chat_id):
    client.table("subscribers").update(
        {"active": False, "updated_at": datetime.now(timezone.utc).isoformat()}
    ).eq("chat_id", chat_id).execute()


def save_sent(client, ipo_id, alert_type, today):
    client.table("alerts_sent").upsert(
        {"ipo_id": ipo_id, "alert_type": alert_type, "alert_date": today.isoformat()},
        on_conflict="ipo_id,alert_type,alert_date",
    ).execute()


# ---------- Telegram ----------

def send_message(session, token, chat_id, text):
    """Send one message. Returns "sent", "blocked" (403) or "failed"."""
    url = f"{TELEGRAM_API}/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "disable_web_page_preview": True}
    for attempt in range(2):
        try:
            response = session.post(url, json=payload, timeout=15)
        except requests.RequestException as exc:
            print(f"  chat {chat_id}: network error: {exc}", file=sys.stderr)
            return "failed"
        if response.ok:
            return "sent"
        if response.status_code == 403:
            return "blocked"
        # Too many requests: wait as long as Telegram asks, then try once more.
        if response.status_code == 429 and attempt == 0:
            retry_after = response.json().get("parameters", {}).get("retry_after", 1)
            time.sleep(retry_after)
            continue
        print(f"  chat {chat_id}: Telegram error {response.status_code}: {response.text}", file=sys.stderr)
        return "failed"
    return "failed"


# ---------- Main ----------

def parse_args():
    parser = argparse.ArgumentParser(description="Send daily IPO alerts on Telegram.")
    parser.add_argument("--dry-run", action="store_true", help="print messages; send and save nothing")
    parser.add_argument("--test-chat-id", type=int, help="send only to this chat; save nothing")
    return parser.parse_args()


def main():
    args = parse_args()

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SECRET_KEY")
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not url or not key:
        raise SystemExit("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env")
    if not token and not args.dry_run:
        raise SystemExit("Missing TELEGRAM_BOT_TOKEN in .env")

    client = create_client(url, key)
    today = today_in_ist()
    print(f"Today (IST): {today.isoformat()}")

    done = already_sent(client, today)
    found = find_alerts(client, today)
    alerts = [(ipo, kind) for ipo, kind in found if (ipo["id"], kind) not in done]
    skipped = len(found) - len(alerts)

    if args.test_chat_id is not None:
        chat_ids = [args.test_chat_id]
        print(f"Test mode: sending only to chat {args.test_chat_id}. Nothing will be saved.")
    else:
        chat_ids = active_chat_ids(client)
    print(f"Alerts to send: {len(alerts)} (already sent today: {skipped}). Recipients: {len(chat_ids)}.")

    session = requests.Session()
    sent = failed = blocked = 0
    blocked_chats = set()

    for ipo, alert_type in alerts:
        text = build_message(ipo, alert_type)

        if args.dry_run:
            print(f"\n--- {alert_type}: {ipo['company_name']} (would go to {len(chat_ids)} chats) ---")
            print(text)
            continue

        print(f"Sending {alert_type}: {ipo['company_name']}")
        sent_this_alert = 0
        for chat_id in chat_ids:
            if chat_id in blocked_chats:
                continue
            result = send_message(session, token, chat_id, text)
            if result == "sent":
                sent += 1
                sent_this_alert += 1
            else:
                failed += 1
                if result == "blocked":
                    blocked += 1
                    blocked_chats.add(chat_id)
                    print(f"  chat {chat_id}: blocked the bot, marking inactive")
                    try:
                        deactivate(client, chat_id)
                    except Exception as exc:  # not worth stopping the other alerts
                        print(f"  chat {chat_id}: could not mark inactive: {exc}", file=sys.stderr)
            time.sleep(MESSAGE_GAP_SECONDS)

        # Save only real runs that reached someone, so a failed run can be retried.
        if args.test_chat_id is None and sent_this_alert > 0:
            save_sent(client, ipo["id"], alert_type, today)

    print()
    print("Summary")
    print(f"  Alerts found:  {len(alerts)}")
    if args.dry_run:
        print("  Dry run: no messages sent, nothing saved.")
    else:
        print(f"  Messages sent: {sent}")
        print(f"  Failed:        {failed} (blocked the bot: {blocked})")


if __name__ == "__main__":
    main()
