import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth, badRequest } from "@/lib/api";
import { checkAvailability } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const date = request.nextUrl.searchParams.get("date");
  const ignore = request.nextUrl.searchParams.get("ignore") || undefined;
  if (!date) return badRequest("Falta la fecha");
  const result = await checkAvailability(date, ignore);
  return NextResponse.json(result);
}
