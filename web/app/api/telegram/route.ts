import { timingSafeEqual } from "node:crypto";
import { type Ipo, formatPriceBand, todayInIndia } from "@/lib/format";
import { getIpos } from "@/lib/ipos";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const DISCLAIMER = "Not investment advice.";

const COMMANDS = `Commands:
/start - get IPO alerts
/stop - stop alerts
/today - IPOs that open or close today`;

// Telegram sends our secret in this header on every update.
// If the secret is not set on the server, reject everything.
function secretMatches(header: string | null) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const update = await request.json().catch(() => null);
  const message = update?.message;
  const chatId = message?.chat?.id;
  const text = message?.text;

  // Ignore updates that are not plain text messages (photos, edits, etc).
  if (typeof chatId !== "number" || typeof text !== "string") {
    return Response.json({ ok: true });
  }

  // "/start@MyBot hello" -> "/start"
  const command = text.trim().split(/\s+/)[0].split("@")[0].toLowerCase();

  let reply: string;
  try {
    if (command === "/start") {
      reply = await handleStart(chatId, message.from?.username ?? null);
    } else if (command === "/stop") {
      reply = await handleStop(chatId);
    } else if (command === "/today") {
      reply = await handleToday();
    } else {
      reply = `Sorry, I don't know that one.\n\n${COMMANDS}`;
    }
  } catch (error) {
    console.error("Telegram command failed:", error);
    reply = "Sorry, something went wrong. Please try again later.";
  }

  await sendMessage(chatId, `${reply}\n\n${DISCLAIMER}`);

  // Always answer 200 so Telegram does not resend the same update.
  return Response.json({ ok: true });
}

async function handleStart(chatId: number, username: string | null) {
  const { error } = await getSupabaseAdmin()
    .from("subscribers")
    .upsert(
      { chat_id: chatId, username, active: true, updated_at: new Date().toISOString() },
      { onConflict: "chat_id" },
    );
  if (error) throw new Error(error.message);

  return `Welcome to IPO Tracker!

You will get alerts when an IPO:
- opens for bidding
- closes for bidding
- has its allotment
- lists on the exchange

${COMMANDS}`;
}

async function handleStop(chatId: number) {
  const { error } = await getSupabaseAdmin()
    .from("subscribers")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("chat_id", chatId);
  if (error) throw new Error(error.message);

  return "You are unsubscribed. You will not get any more alerts.\nSend /start any time to turn them back on.";
}

async function handleToday() {
  const today = todayInIndia();
  const ipos = await getIpos();
  const opening = ipos.filter((ipo) => ipo.open_date === today);
  const closing = ipos.filter((ipo) => ipo.close_date === today);

  if (opening.length === 0 && closing.length === 0) {
    return "No IPOs open or close today.";
  }

  const parts: string[] = [];
  if (opening.length > 0) parts.push(`Opening today:\n${opening.map(ipoLine).join("\n")}`);
  if (closing.length > 0) parts.push(`Closing today:\n${closing.map(ipoLine).join("\n")}`);
  return parts.join("\n\n");
}

function ipoLine(ipo: Ipo) {
  const segment = ipo.segment === "sme" ? "SME" : "Mainboard";
  const lot = ipo.lot_size ? `, lot ${ipo.lot_size}` : "";
  return `- ${ipo.company_name} (${segment}): ${formatPriceBand(ipo)}${lot}`;
}

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("Missing TELEGRAM_BOT_TOKEN");
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) console.error("Telegram sendMessage failed:", res.status, await res.text());
  } catch (error) {
    console.error("Telegram sendMessage failed:", error);
  }
}
