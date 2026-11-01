import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">IPO not found</h1>
      <p className="mt-2 text-sm text-muted">This page may have moved or never existed.</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity duration-150 hover:opacity-90"
      >
        Back to all IPOs
      </Link>
    </div>
  );
}
