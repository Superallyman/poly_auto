// app/api/pingSupabase/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Basic Supabase client (anon key is fine for a read-only ping)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { error } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Ping failed:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Supabase pinged successfully." });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Unexpected error in ping:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
