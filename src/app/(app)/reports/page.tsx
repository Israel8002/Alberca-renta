import { buildReport } from "@/lib/reports";
import { ReportsView } from "./reports-view";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const year = new Date().getUTCFullYear();
  const report = await buildReport(year);
  return <ReportsView initial={report} initialYear={year} />;
}
