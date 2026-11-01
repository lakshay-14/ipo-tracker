import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IPO Tracker",
  description: "Every Indian IPO in one place: dates, price band, lot size and GMP.",
};

const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <header className="sticky top-0 z-20 border-b border-line bg-background/80 backdrop-blur">
          <div className={`${container} flex h-14 items-center`}>
            <Link
              href="/"
              className="text-[15px] font-semibold tracking-tight transition-opacity duration-150 hover:opacity-70"
            >
              IPO Tracker
            </Link>
          </div>
        </header>

        <main className={`${container} flex-1 py-10 sm:py-14`}>{children}</main>

        <footer className="border-t border-line">
          <p className={`${container} py-6 text-sm text-muted`}>Not investment advice.</p>
        </footer>
      </body>
    </html>
  );
}
