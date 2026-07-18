import type { Config } from "@prisma/client";

/**
 * Suggested base price for a given date based on the day of week.
 * (Season / holiday prices are applied manually by the admin when relevant.)
 */
export function basePriceForDate(config: Config, date: Date): number {
  // getUTCDay: 0 = Sunday ... 6 = Saturday
  const day = date.getUTCDay();
  switch (day) {
    case 0:
      return config.priceSun;
    case 5:
      return config.priceFri;
    case 6:
      return config.priceSat;
    default:
      return config.priceMonThu;
  }
}

/** Extra charge for guests above the included amount. */
export function extraGuestCharge(config: Config, guests: number): number {
  const extra = Math.max(0, guests - config.includedGuests);
  return extra * config.extraGuestCost;
}

/** Suggested total = base for date + extra guests. */
export function suggestedTotal(
  config: Config,
  date: Date,
  guests: number
): number {
  return basePriceForDate(config, date) + extraGuestCharge(config, guests);
}

export function totalPaid(payments: { amount: number }[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

export function balance(price: number, deposit: number, paid: number): number {
  // deposit is recorded on the reservation; payments are the actual money in.
  // The pending balance is price minus everything received.
  return Math.max(0, price - paid);
}
