import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validation";
import { requireAuth, badRequest, serverError } from "@/lib/api";

export async function GET(request: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { fullName: "asc" },
    include: { _count: { select: { reservations: true } } },
  });
  return NextResponse.json(clients);
}

export async function POST(request: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Datos inválidos", parsed.error.flatten());
    }
    const data = parsed.data;
    const client = await prisma.client.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        guests: data.guests,
        notes: data.notes || null,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
