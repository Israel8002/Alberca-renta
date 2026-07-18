import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/blocked-dates/[id]">
) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  await prisma.blockedDate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
