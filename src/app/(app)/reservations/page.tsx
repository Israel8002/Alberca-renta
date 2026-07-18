import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { toISODate } from "@/lib/utils";
import {
  ReservationsManager,
  type ReservationDTO,
  type ClientOption,
  type ConfigDTO,
} from "./reservations-manager";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  const [reservations, clients, config] = await Promise.all([
    prisma.reservation.findMany({
      include: { client: true, payments: { orderBy: { createdAt: "desc" } } },
      orderBy: { date: "desc" },
    }),
    prisma.client.findMany({ orderBy: { fullName: "asc" } }),
    getConfig(),
  ]);

  const dto: ReservationDTO[] = reservations.map((r) => ({
    id: r.id,
    clientId: r.clientId,
    clientName: r.client.fullName,
    clientPhone: r.client.phone,
    clientAddress: r.client.address,
    date: toISODate(r.date),
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    guests: r.guests,
    price: r.price,
    deposit: r.deposit,
    status: r.status,
    notes: r.notes,
    googleEventId: r.googleEventId,
    payments: r.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      type: p.type,
      method: p.method,
      note: p.note,
      createdAt: p.createdAt.toISOString(),
    })),
  }));

  const clientOptions: ClientOption[] = clients.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    phone: c.phone,
    address: c.address,
    guests: c.guests,
  }));

  const configDto: ConfigDTO = {
    checkInTime: config.checkInTime,
    checkOutTime: config.checkOutTime,
    priceMonThu: config.priceMonThu,
    priceFri: config.priceFri,
    priceSat: config.priceSat,
    priceSun: config.priceSun,
    includedGuests: config.includedGuests,
    extraGuestCost: config.extraGuestCost,
    maxCapacity: config.maxCapacity,
    minDeposit: config.minDeposit,
    businessName: config.businessName,
    poolAddress: config.poolAddress,
  };

  return (
    <ReservationsManager
      initial={dto}
      clients={clientOptions}
      config={configDto}
    />
  );
}
