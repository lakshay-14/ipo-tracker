// Tells Telegram where to send bot messages, and which secret to send with them.
//
// Usage (from the web/ folder):
//   npm run telegram:webhook -- https://your-site.vercel.app
//
// Reads TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET from .env.local.

const siteUrl = process.argv[2];
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!siteUrl || !siteUrl.startsWith("https://")) {
  console.error("Give your public https site URL, e.g. https://your-site.vercel.app");
  process.exit(1);
}
if (!token || !secret) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_WEBHOOK_SECRET in .env.local");
  process.exit(1);
}
// Telegram allows only A-Z, a-z, 0-9, _ and -, up to 256 characters.
if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
  console.error("TELEGRAM_WEBHOOK_SECRET may only use letters, numbers, _ and -");
  process.exit(1);
}

const webhookUrl = `${siteUrl.replace(/\/+$/, "")}/api/telegram`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  }),
});
const result = await res.json();

if (result.ok) {
  console.log(`Webhook set: ${webhookUrl}`);
} else {
  console.error("Telegram said no:", result.description);
  process.exit(1);
}
