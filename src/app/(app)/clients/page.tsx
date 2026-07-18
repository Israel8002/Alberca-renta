import { prisma } from "@/lib/prisma";
import { ClientsManager, type ClientRow } from "./clients-manager";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { fullName: "asc" },
    include: { _count: { select: { reservations: true } } },
  });
  const rows: ClientRow[] = clients.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    phone: c.phone,
    email: c.email,
    address: c.address,
    guests: c.guests,
    notes: c.notes,
    reservationsCount: c._count.reservations,
  }));
  return <ClientsManager initial={rows} />;
}
