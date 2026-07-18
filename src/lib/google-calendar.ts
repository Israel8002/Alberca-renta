import { google, type calendar_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants";
import type { Client, Reservation } from "@prisma/client";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

type ReservationWithClient = Reservation & { client: Client };

/**
 * Builds an authenticated Calendar client from the admin's stored Google
 * OAuth tokens. Returns null when Google is not configured / not connected,
 * so the app keeps working without Calendar integration.
 */
async function getCalendarClient(): Promise<calendar_v3.Calendar | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const account = await prisma.account.findFirst({
    where: { provider: "google", refresh_token: { not: null } },
    orderBy: { id: "desc" },
  });
  if (!account?.refresh_token) return null;

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({
    refresh_token: account.refresh_token,
    access_token: account.access_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  return google.calendar({ version: "v3", auth: oauth2 });
}

function buildEvent(r: ReservationWithClient): calendar_v3.Schema$Event {
  const date = new Date(r.date).toISOString().slice(0, 10);
  return {
    summary: `Alberca: ${r.client.fullName} (${STATUS_LABELS[r.status]})`,
    description: [
      `Cliente: ${r.client.fullName}`,
      `Teléfono: ${r.client.phone}`,
      `Personas: ${r.guests}`,
      `Total: ${formatCurrency(r.price)}`,
      `Anticipo: ${formatCurrency(r.deposit)}`,
      `Estado: ${STATUS_LABELS[r.status]}`,
      r.notes ? `Notas: ${r.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    start: { dateTime: `${date}T${r.checkIn}:00`, timeZone: "America/Mexico_City" },
    end: { dateTime: `${date}T${r.checkOut}:00`, timeZone: "America/Mexico_City" },
  };
}

export async function createCalendarEvent(
  r: ReservationWithClient
): Promise<string | null> {
  try {
    const calendar = await getCalendarClient();
    if (!calendar) return null;
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: buildEvent(r),
    });
    return res.data.id ?? null;
  } catch (err) {
    console.error("[google-calendar] create failed:", err);
    return null;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  r: ReservationWithClient
): Promise<void> {
  try {
    const calendar = await getCalendarClient();
    if (!calendar) return;
    await calendar.events.update({
      calendarId: CALENDAR_ID,
      eventId,
      requestBody: buildEvent(r),
    });
  } catch (err) {
    console.error("[google-calendar] update failed:", err);
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    const calendar = await getCalendarClient();
    if (!calendar) return;
    await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
  } catch (err) {
    console.error("[google-calendar] delete failed:", err);
  }
}
