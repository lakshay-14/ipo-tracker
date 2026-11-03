# IPO Tracker

A simple tracker for Indian IPOs, with a daily Telegram alert.

**Live site:** https://ipo-tracker-eta.vercel.app/
**Telegram bot:** [@IpotrackerBot](https://t.me/IpotrackerBot)

## The problem

IPO information in India is spread across many sites. Dates, price bands, and lot sizes sit in different places. Retail investors often miss key dates like closing day or allotment day.

## What it does

- Lists open, upcoming, and closed IPOs in one clean place
- Filters by Mainboard and SME
- Shows price band, lot size, issue size, and key dates
- Sends one daily Telegram message with what opens, closes, allots, and lists today
- Refreshes data automatically every morning

## How it works

1. A Python script collects IPO data once a day and saves it in Supabase.
2. A scheduled GitHub Actions job runs the script and sends the Telegram digest.
3. A Next.js website reads from Supabase and shows the data.
4. A Telegram webhook on the same site lets users subscribe with /start and leave with /stop.

## Tech stack

| Part | Tool |
|---|---|
| Website | Next.js, Tailwind |
| Database | Supabase (Postgres) |
| Data pipeline | Python, BeautifulSoup |
| Scheduling | GitHub Actions |
| Alerts | Telegram Bot API |
| Hosting | Vercel |

## Project structure

```
db/          SQL schema
pipeline/    Python scripts (fetch IPOs, send alerts)
web/         Next.js website and Telegram webhook
.github/     Scheduled workflows
```

## Run it yourself

1. Create a Supabase project and run `db/schema.sql`.
2. Copy the environment variables below into `.env` (pipeline) and `web/.env.local` (website).
3. Pipeline: `pip install -r requirements.txt`, then `python pipeline/fetch_ipos.py`.
4. Website: `cd web`, `npm install`, `npm run dev`.

Environment variables:

```
SUPABASE_URL
SUPABASE_SECRET_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Never commit these values.

## Decisions and lessons

- **Separate scripts:** the IPO list and the alerts run as separate jobs, so one failing does not break the other.
- **Duplicate guard:** an `alerts_sent` table stops the same alert going out twice.
- **One digest, not many pings:** nine separate alerts in one day felt spammy, so I moved to a single daily message.
- **Safe parsing:** if the source page changes, the script stops and leaves the database untouched.
- **Row level security:** the website uses a read-only public key. The subscriber list is only reachable with the server key.

## Roadmap

- GMP and GMP history
- AI summary of the RHP with business, positives, and risks
- Subscription status by category
- Watchlist

## Results

- Users: _add number_
- Weekly returning users: _add number_

## Disclaimer

Not investment advice. Data is collected from public sources and may contain errors. Always read the official offer documents before investing.
