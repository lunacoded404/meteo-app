import { NextResponse } from "next/server";
import { api as serverApi } from "@/lib/adminApi";

export async function GET() {
  const data = await serverApi("/api/admin/layers/");
  return NextResponse.json(data);
}
