import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { reservationSchema } from "@/lib/validation";
import { requireAuth, badRequest, serverError } from "@/lib/api";
import { checkAvailability } from "@/lib/availability";
import { createCalendarEvent } from "@/lib/google-calendar";
import { OCCUPYING_STATUSES } from "@/lib/constants";
import { dateOnly } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const params = request.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");
  const status = params.get("status");

  const reservations = await prisma.reservation.findMany({
    where: {
      ...(from && to
        ? { date: { gte: dateOnly(from), lte: dateOnly(to) } }
        : {}),
      ...(status ? { status: status as never } : {}),
    },
    include: { client: true, payments: true },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(reservations);
}

export async function POST(request: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  try {
    const parsed = reservationSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("Datos inválidos", parsed.error.flatten());
    const d = parsed.data;

    // Prevent double booking for occupying statuses.
    if (OCCUPYING_STATUSES.includes(d.status)) {
      const availability = await checkAvailability(d.date);
      if (!availability.available) {
        return badRequest(availability.reason || "Fecha no disponible");
      }
    }

    const reservation = await prisma.reservation.create({
      data: {
        clientId: d.clientId,
        date: dateOnly(d.date),
        checkIn: d.checkIn,
        checkOut: d.checkOut,
        guests: d.guests,
        price: d.price,
        deposit: d.deposit,
        status: d.status,
        notes: d.notes || null,
      },
      include: { client: true },
    });

    // Record the deposit as an initial payment when provided.
    if (d.deposit > 0) {
      await prisma.payment.create({
        data: {
          reservationId: reservation.id,
          amount: d.deposit,
          type: "ANTICIPO",
          note: "Anticipo inicial",
        },
      });
    }

    const eventId = await createCalendarEvent(reservation);
    if (eventId) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { googleEventId: eventId },
      });
    }

    return NextResponse.json({ ...reservation, googleEventId: eventId }, { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
