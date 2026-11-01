import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import type { Ipo } from "./format";

// Keys come from web/.env.local. They are never written in code.
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in web/.env.local",
    );
  }
  return createClient(url, key);
}

// Data refreshes once a day, so caching for hours is safe.
export async function getIpos(): Promise<Ipo[]> {
  "use cache";
  cacheLife("hours");

  const { data, error } = await getSupabase()
    .from("ipos")
    .select("*")
    .order("open_date", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data as Ipo[];
}

export async function getIpo(id: string): Promise<Ipo | null> {
  "use cache";
  cacheLife("hours");

  const { data, error } = await getSupabase()
    .from("ipos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  // A bad id (not a uuid) comes back as an error. Treat it as "not found".
  if (error) return null;
  return data as Ipo | null;
}
