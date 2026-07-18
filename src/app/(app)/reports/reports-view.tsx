"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button, Card, Select } from "@/components/ui";
import { apiFetch } from "@/lib/http";
import { formatCurrency } from "@/lib/utils";
import type { ReportSummary } from "@/lib/reports";

export function ReportsView({
  initial,
  initialYear,
}: {
  initial: ReportSummary;
  initialYear: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [report, setReport] = useState<ReportSummary>(initial);
  const [loading, setLoading] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => initialYear - i);
  const maxIncome = Math.max(...report.incomeByMonth.map((m) => m.income), 1);

  async function changeYear(y: number) {
    setYear(y);
    setLoading(true);
    try {
      const r = await apiFetch<ReportSummary>(`/api/reports?year=${y}`);
      setReport(r);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Reportes
        </h1>
        <div className="flex items-center gap-2">
          <Select
            value={year}
            onChange={(e) => changeYear(Number(e.target.value))}
            className="w-auto"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <a href={`/api/reports/export?format=pdf&year=${year}`}>
            <Button variant="secondary">
              <FileDown className="h-4 w-4" /> PDF
            </Button>
          </a>
          <a href={`/api/reports/export?format=excel&year=${year}`}>
            <Button variant="secondary">
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Ingresos anuales</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(report.totalIncome)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Reservaciones {year}</p>
          <p className="text-2xl font-bold text-sky-600">
            {report.totalReservations}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Promedio mensual</p>
          <p className="text-2xl font-bold text-violet-600">
            {formatCurrency(report.totalIncome / 12)}
          </p>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Ingresos y reservaciones por mes
          </h2>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
        <div className="flex h-48 items-end gap-1.5">
          {report.incomeByMonth.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-sky-500/80 transition-all"
                style={{ height: `${(m.income / maxIncome) * 100}%` }}
                title={`${m.label}: ${formatCurrency(m.income)}`}
              />
              <span className="text-[10px] text-slate-400">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-0">
          <h2 className="border-b border-slate-100 p-4 font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
            Desglose mensual
          </h2>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Mes</th>
                <th className="px-4 py-2 font-medium">Reservas</th>
                <th className="px-4 py-2 text-right font-medium">Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.incomeByMonth.map((m) => (
                <tr key={m.month}>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                    {m.label}
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                    {m.count}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-800 dark:text-slate-200">
                    {formatCurrency(m.income)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-0">
          <h2 className="border-b border-slate-100 p-4 font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
            Clientes frecuentes
          </h2>
          {report.frequentClients.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">Sin datos.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Reservas</th>
                  <th className="px-4 py-2 text-right font-medium">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report.frequentClients.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 text-slate-800 dark:text-slate-200">
                      {c.name}
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                      {c.count}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-400">
                      {formatCurrency(c.income)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
