import "server-only";
import { createClient } from "@supabase/supabase-js";

// Supabase client with the SECRET key. Server only: the "server-only"
// import above makes the build fail if browser code ever imports this.
// The env name has no NEXT_PUBLIC_ prefix, so Next.js never sends it out.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
