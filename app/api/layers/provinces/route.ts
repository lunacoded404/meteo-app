import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const { data, error } = await supabase.rpc("vn_provinces_geojson");

  if (error) {
    console.error("Error fetching provinces geojson:", error);
    return NextResponse.json({ error: "Cannot load layer" }, { status: 500 });
  }

  return NextResponse.json(data);
}
