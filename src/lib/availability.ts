import { prisma } from "@/lib/prisma";
import { OCCUPYING_STATUSES } from "@/lib/constants";
import { dateOnly } from "@/lib/utils";

export interface AvailabilityResult {
  available: boolean;
  reason?: string;
}

/**
 * Checks whether a date is free for a new/edited reservation.
 * A date is unavailable if a blocked/maintenance date exists, or another
 * occupying reservation already exists on that day.
 */
export async function checkAvailability(
  date: Date | string,
  ignoreReservationId?: string
): Promise<AvailabilityResult> {
  const day = dateOnly(date);

  const blocked = await prisma.blockedDate.findUnique({ where: { date: day } });
  if (blocked) {
    return {
      available: false,
      reason:
        blocked.type === "MAINTENANCE"
          ? "La fecha está marcada como mantenimiento."
          : "La fecha está bloqueada.",
    };
  }

  const existing = await prisma.reservation.findFirst({
    where: {
      date: day,
      status: { in: OCCUPYING_STATUSES },
      ...(ignoreReservationId ? { NOT: { id: ignoreReservationId } } : {}),
    },
  });
  if (existing) {
    return {
      available: false,
      reason: "Ya existe una reservación para esta fecha.",
    };
  }

  return { available: true };
}
