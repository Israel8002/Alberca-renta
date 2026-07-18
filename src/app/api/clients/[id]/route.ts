import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validation";
import { requireAuth, badRequest, serverError } from "@/lib/api";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/clients/[id]">) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: { reservations: { orderBy: { date: "desc" } } },
  });
  if (!client) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/clients/[id]">) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  try {
    const parsed = clientSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("Datos inválidos", parsed.error.flatten());
    const d = parsed.data;
    const client = await prisma.client.update({
      where: { id },
      data: {
        fullName: d.fullName,
        phone: d.phone,
        email: d.email || null,
        address: d.address || null,
        guests: d.guests,
        notes: d.notes || null,
      },
    });
    return NextResponse.json(client);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/clients/[id]">) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const count = await prisma.reservation.count({ where: { clientId: id } });
  if (count > 0) {
    return badRequest(
      "No se puede eliminar: el cliente tiene reservaciones asociadas."
    );
  }
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
