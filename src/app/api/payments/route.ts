import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validation";
import { requireAuth, badRequest, serverError } from "@/lib/api";
import { totalPaid } from "@/lib/pricing";
import { updateCalendarEvent } from "@/lib/google-calendar";

export async function POST(request: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  try {
    const parsed = paymentSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("Datos inválidos", parsed.error.flatten());
    const d = parsed.data;

    const reservation = await prisma.reservation.findUnique({
      where: { id: d.reservationId },
      include: { payments: true, client: true },
    });
    if (!reservation) return badRequest("Reservación no encontrada");

    const payment = await prisma.payment.create({
      data: {
        reservationId: d.reservationId,
        amount: d.amount,
        type: d.type,
        method: d.method || null,
        note: d.note || null,
      },
    });

    // Auto-mark as liquidated once fully paid.
    const paid = totalPaid(reservation.payments) + d.amount;
    if (paid >= reservation.price && reservation.status === "APARTADO") {
      const updated = await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: "LIQUIDADO" },
        include: { client: true },
      });
      if (updated.googleEventId) {
        await updateCalendarEvent(updated.googleEventId, updated);
      }
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
