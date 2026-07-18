import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { configSchema } from "@/lib/validation";
import { requireAuth, badRequest, serverError } from "@/lib/api";
import { getConfig } from "@/lib/config";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const config = await getConfig();
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    await getConfig(); // ensure row exists
    const parsed = configSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("Datos inválidos", parsed.error.flatten());
    const d = parsed.data;
    const config = await prisma.config.update({
      where: { id: 1 },
      data: {
        ...d,
        poolAddress: d.poolAddress || "",
        businessName: d.businessName || "Alberca de Eventos",
        generalNotes: d.generalNotes || "",
      },
    });
    return NextResponse.json(config);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
