import { prisma } from "@/lib/prisma";
import type { Config } from "@prisma/client";

/** Returns the single config row, creating defaults on first use. */
export async function getConfig(): Promise<Config> {
  const existing = await prisma.config.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.config.create({ data: { id: 1 } });
}
