import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api";
import { buildReport } from "@/lib/reports";

export async function GET(request: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getUTCFullYear();
  const report = await buildReport(year);
  return NextResponse.json(report);
}
