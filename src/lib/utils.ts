export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value ?? 0);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(d);
}

/** Returns a Date at UTC midnight for the given YYYY-MM-DD string. */
export function dateOnly(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(
      Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate())
    );
  }
  const [y, m, d] = input.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** YYYY-MM-DD from a Date (UTC). */
export function toISODate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
