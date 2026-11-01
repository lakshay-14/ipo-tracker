# IPO Tracker (working name)

## Problem
Indian retail investors check many sites for IPO info.
GMP, dates, and subscription data are scattered.
People miss key dates like closing day and allotment.

## User
Indian retail investors who apply to IPOs.
They use Telegram or WhatsApp daily.

## Goal
One clean place to see every IPO, plus alerts on key dates.

## v1 features (must have)
- List of open, upcoming, and closed IPOs
- Detail page: GMP, issue size, price band, lot size,
  minimum investment, key dates
- Mainboard and SME filter
- Telegram alerts: opens, closes, allotment, listing
- Data refreshes once a day

## v2 features (later)
- Live subscription tracker (QIB, NII, retail)
- GMP history chart
- GMP accuracy score (predicted vs actual listing gain)
- AI summary of the RHP
- Watchlist and listing P&L
- Calendar export

## Out of scope
- No buying or applying for IPOs
- No investment advice
- No payments

## Success metrics (targets)
- 50 users in the first 4 weeks
- 30% of users return weekly
- Alerts delivered on time

## Tech stack
- Next.js and Tailwind (frontend)
- Supabase (database)
- Python scripts on GitHub Actions (daily data pull)
- Telegram Bot API (alerts)
- Vercel (hosting)

## Data rules
- Prefer official NSE and BSE data
- GMP is unofficial. Show a disclaimer on every page:
  "Not investment advice."
- Check each source's terms before scraping

## Rules for the AI assistant
- Keep code simple and readable
- Build one small step at a time
- Explain what you changed in plain language
- Never put API keys in code. Use .env files
- Ask before making big changes