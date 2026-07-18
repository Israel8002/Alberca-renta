import type { NextRequest } from "next/server";
import { requireAuth, badRequest } from "@/lib/api";
import { buildReport } from "@/lib/reports";
import { formatCurrency } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const format = request.nextUrl.searchParams.get("format") || "pdf";
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getUTCFullYear();
  const report = await buildReport(year);

  if (format === "excel") {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Alberca de Eventos";

    const ws = wb.addWorksheet(`Ingresos ${year}`);
    ws.columns = [
      { header: "Mes", key: "label", width: 12 },
      { header: "Reservaciones", key: "count", width: 16 },
      { header: "Ingresos", key: "income", width: 18 },
    ];
    report.incomeByMonth.forEach((m) =>
      ws.addRow({ label: m.label, count: m.count, income: m.income })
    );
    ws.addRow({
      label: "TOTAL",
      count: report.totalReservations,
      income: report.totalIncome,
    });
    ws.getColumn("income").numFmt = '"$"#,##0.00';
    ws.getRow(1).font = { bold: true };

    const cw = wb.addWorksheet("Clientes frecuentes");
    cw.columns = [
      { header: "Cliente", key: "name", width: 30 },
      { header: "Reservaciones", key: "count", width: 16 },
      { header: "Ingresos", key: "income", width: 18 },
    ];
    report.frequentClients.forEach((c) => cw.addRow(c));
    cw.getColumn("income").numFmt = '"$"#,##0.00';
    cw.getRow(1).font = { bold: true };

    const buffer = await wb.xlsx.writeBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="reporte-${year}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Reporte anual ${year}`, 14, 18);
    doc.setFontSize(11);
    doc.text(
      `Ingresos totales: ${formatCurrency(report.totalIncome)}  |  Reservaciones: ${report.totalReservations}`,
      14,
      26
    );

    autoTable(doc, {
      startY: 32,
      head: [["Mes", "Reservaciones", "Ingresos"]],
      body: report.incomeByMonth.map((m) => [
        m.label,
        String(m.count),
        formatCurrency(m.income),
      ]),
      theme: "striped",
      headStyles: { fillColor: [14, 165, 233] },
    });

    const afterFirst =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? 32;
    autoTable(doc, {
      startY: afterFirst + 10,
      head: [["Cliente frecuente", "Reservaciones", "Ingresos"]],
      body: report.frequentClients.map((c) => [
        c.name,
        String(c.count),
        formatCurrency(c.income),
      ]),
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
    });

    const buffer = Buffer.from(doc.output("arraybuffer"));
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte-${year}.pdf"`,
      },
    });
  }

  return badRequest("Formato inválido");
}
