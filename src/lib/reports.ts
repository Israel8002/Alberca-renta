import { prisma } from "@/lib/prisma";

export interface ReportSummary {
  year: number;
  incomeByMonth: { month: number; label: string; income: number; count: number }[];
  incomeByDay: { date: string; income: number }[];
  totalIncome: number;
  totalReservations: number;
  frequentClients: { id: string; name: string; count: number; income: number }[];
}

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export async function buildReport(year: number): Promise<ReportSummary> {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const payments = await prisma.payment.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: { reservation: { include: { client: true } } },
  });

  const reservations = await prisma.reservation.findMany({
    where: {
      date: { gte: start, lt: end },
      status: { not: "CANCELADO" },
    },
    include: { client: true },
  });

  const incomeByMonth = MONTHS.map((label, i) => ({
    month: i + 1,
    label,
    income: 0,
    count: 0,
  }));
  const dayMap = new Map<string, number>();
  let totalIncome = 0;

  for (const p of payments) {
    const m = p.createdAt.getUTCMonth();
    incomeByMonth[m].income += p.amount;
    totalIncome += p.amount;
    const key = p.createdAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) || 0) + p.amount);
  }

  const clientMap = new Map<
    string,
    { id: string; name: string; count: number; income: number }
  >();
  for (const r of reservations) {
    incomeByMonth[r.date.getUTCMonth()].count += 1;
    const existing = clientMap.get(r.clientId) || {
      id: r.clientId,
      name: r.client.fullName,
      count: 0,
      income: 0,
    };
    existing.count += 1;
    existing.income += r.price;
    clientMap.set(r.clientId, existing);
  }

  const incomeByDay = Array.from(dayMap.entries())
    .map(([date, income]) => ({ date, income }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const frequentClients = Array.from(clientMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    year,
    incomeByMonth,
    incomeByDay,
    totalIncome,
    totalReservations: reservations.length,
    frequentClients,
  };
}
