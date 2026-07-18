import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { blockedDateSchema } from "@/lib/validation";
import { requireAuth, badRequest, serverError } from "@/lib/api";
import { dateOnly } from "@/lib/utils";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const dates = await prisma.blockedDate.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(dates);
}

export async function POST(request: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    const parsed = blockedDateSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("Datos inválidos", parsed.error.flatten());
    const d = parsed.data;
    const created = await prisma.blockedDate.upsert({
      where: { date: dateOnly(d.date) },
      update: { type: d.type, reason: d.reason || null },
      create: { date: dateOnly(d.date), type: d.type, reason: d.reason || null },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
