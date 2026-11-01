import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-10 text-center">
      <h1 className="text-xl font-semibold text-slate-900">IPO not found</h1>
      <Link href="/" className="mt-3 inline-block text-sm text-sky-700 underline">
        Back to all IPOs
      </Link>
    </div>
  );
}
