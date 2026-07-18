import { getConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { toISODate } from "@/lib/utils";
import { SettingsManager, type BlockedDTO } from "./settings-manager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [config, blocked] = await Promise.all([
    getConfig(),
    prisma.blockedDate.findMany({ orderBy: { date: "asc" } }),
  ]);
  const blockedDto: BlockedDTO[] = blocked.map((b) => ({
    id: b.id,
    date: toISODate(b.date),
    type: b.type,
    reason: b.reason,
  }));
  return <SettingsManager config={config} blocked={blockedDto} />;
}
