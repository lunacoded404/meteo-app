import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client dùng cho code chạy trên browser (client components, hooks,…)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
