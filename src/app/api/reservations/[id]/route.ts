import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { reservationSchema } from "@/lib/validation";
import { requireAuth, badRequest, serverError } from "@/lib/api";
import { checkAvailability } from "@/lib/availability";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";
import { OCCUPYING_STATUSES } from "@/lib/constants";
import { dateOnly } from "@/lib/utils";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/reservations/[id]">) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { client: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!reservation) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(reservation);
}

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/reservations/[id]">) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  try {
    const parsed = reservationSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("Datos inválidos", parsed.error.flatten());
    const d = parsed.data;

    if (OCCUPYING_STATUSES.includes(d.status)) {
      const availability = await checkAvailability(d.date, id);
      if (!availability.available) {
        return badRequest(availability.reason || "Fecha no disponible");
      }
    }

    const updated = await prisma.reservation.update({
      where: { id },
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

    // Sync Google Calendar
    if (d.status === "CANCELADO" && updated.googleEventId) {
      await deleteCalendarEvent(updated.googleEventId);
      await prisma.reservation.update({
        where: { id },
        data: { googleEventId: null },
      });
    } else if (updated.googleEventId) {
      await updateCalendarEvent(updated.googleEventId, updated);
    } else if (OCCUPYING_STATUSES.includes(d.status)) {
      const eventId = await createCalendarEvent(updated);
      if (eventId) {
        await prisma.reservation.update({
          where: { id },
          data: { googleEventId: eventId },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/reservations/[id]">) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (reservation.googleEventId) {
    await deleteCalendarEvent(reservation.googleEventId);
  }
  await prisma.reservation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
