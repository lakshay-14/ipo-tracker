const BOT_URL = "https://t.me/IpotrackerBot";
const LABEL = "Get alerts on Telegram";
const NOTE = "One daily message. Opens, closes, allotment, listing.";

// Small accent button for the top bar. On narrow phones the label shortens to "Get alerts".
export function TelegramButton() {
  return (
    <a
      href={BOT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={LABEL}
      className="inline-flex h-9 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity duration-150 hover:opacity-90"
    >
      <span className="sm:hidden">Get alerts</span>
      <span className="hidden sm:inline">{LABEL}</span>
    </a>
  );
}

// Banner for the home page: the button with one line of gray text under it.
export function TelegramBanner() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <a
        href={BOT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity duration-150 hover:opacity-90 sm:w-auto"
      >
        {LABEL}
      </a>
      <p className="mt-2 text-xs text-muted">{NOTE}</p>
    </div>
  );
}
