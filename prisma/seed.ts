import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function d(offsetDays: number): Date {
  const now = new Date();
  const base = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base;
}

async function main() {
  await prisma.config.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      priceMonThu: 2500,
      priceFri: 3000,
      priceSat: 4000,
      priceSun: 3500,
      priceSeason: 4500,
      priceHoliday: 5000,
      checkInTime: "10:00",
      checkOutTime: "18:00",
      minDeposit: 1000,
      includedGuests: 40,
      maxCapacity: 60,
      extraGuestCost: 50,
      enableGrill: true,
      enableFurniture: true,
      enableBathrooms: true,
      poolAddress: "Av. de los Eventos 123, Col. Centro",
      businessName: "Alberca de Eventos",
      generalNotes: "Se requiere anticipo para apartar la fecha.",
    },
  });

  const ana = await prisma.client.create({
    data: {
      fullName: "Ana Martínez",
      phone: "5512345678",
      email: "ana@example.com",
      address: "Calle Luna 45",
      guests: 30,
      notes: "Cliente frecuente",
    },
  });
  const luis = await prisma.client.create({
    data: {
      fullName: "Luis Hernández",
      phone: "5598765432",
      guests: 50,
    },
  });

  const r1 = await prisma.reservation.create({
    data: {
      clientId: ana.id,
      date: d(3),
      checkIn: "10:00",
      checkOut: "18:00",
      guests: 30,
      price: 4000,
      deposit: 1500,
      status: "APARTADO",
      payments: {
        create: [{ amount: 1500, type: "ANTICIPO", note: "Anticipo inicial" }],
      },
    },
  });
  void r1;

  await prisma.reservation.create({
    data: {
      clientId: luis.id,
      date: d(10),
      checkIn: "12:00",
      checkOut: "20:00",
      guests: 50,
      price: 4500,
      deposit: 4500,
      status: "LIQUIDADO",
      payments: {
        create: [
          { amount: 2000, type: "ANTICIPO" },
          { amount: 2500, type: "FINAL" },
        ],
      },
    },
  });

  await prisma.blockedDate.create({
    data: { date: d(15), type: "MAINTENANCE", reason: "Limpieza profunda" },
  });

  console.log("Seed completado.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
