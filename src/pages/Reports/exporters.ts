import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportCell, ReportTable } from "./metrics";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const INVALID_SHEET_CHARS = /[:\\/?*[\]]/g;

const sheetNames = (tables: ReportTable[]) => {
  const used = new Set<string>();

  return tables.map((table, index) => {
    const base =
      table.label.replace(INVALID_SHEET_CHARS, " ").slice(0, 28).trim() ||
      `Aba ${index + 1}`;

    let name = base;
    let suffix = 2;

    while (used.has(name)) {
      name = `${base.slice(0, 26)} ${suffix}`;
      suffix += 1;
    }

    used.add(name);
    return name;
  });
};

const cellXml = (value: ReportCell) => {
  if (value === null || value === undefined) {
    return '<Cell><Data ss:Type="String"></Data></Cell>';
  }

  if (typeof value === "number") {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }

  return `<Cell><Data ss:Type="String">${escapeXml(String(value))}</Data></Cell>`;
};

const worksheetXml = (table: ReportTable, name: string) => {
  const header = table.columns
    .map(
      (column) =>
        `<Cell ss:StyleID="cabecalho"><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`,
    )
    .join("");

  const body = table.rows
    .map(
      (row) =>
        `<Row>${table.columns.map((column) => cellXml(row[column.key])).join("")}</Row>`,
    )
    .join("");

  return [
    `<Worksheet ss:Name="${escapeXml(name)}">`,
    "<Table>",
    table.columns.map(() => '<Column ss:Width="120"/>').join(""),
    `<Row>${header}</Row>`,
    body,
    "</Table>",
    "</Worksheet>",
  ].join("");
};

const workbookXml = (tables: ReportTable[]) => {
  const names = sheetNames(tables);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"',
    ' xmlns:o="urn:schemas-microsoft-com:office:office"',
    ' xmlns:x="urn:schemas-microsoft-com:office:excel"',
    ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    "<Styles>",
    '<Style ss:ID="cabecalho">',
    '<Font ss:Bold="1"/>',
    '<Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>',
    "</Style>",
    "</Styles>",
    tables.map((table, index) => worksheetXml(table, names[index])).join(""),
    "</Workbook>",
  ].join("");
};

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
};

export const downloadSpreadsheet = (
  fileName: string,
  tables: ReportTable[],
) => {
  if (tables.length === 0) return;

  const blob = new Blob([workbookXml(tables)], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });

  triggerDownload(blob, `${fileName}.xls`);
};

export const downloadCsv = (fileName: string, tables: ReportTable[]) => {
  if (tables.length === 0) return;

  const escapeCell = (value: ReportCell) => {
    if (value === null || value === undefined) return "";
    const text = String(value).replace(/"/g, '""');
    return /[";\n]/.test(text) ? `"${text}"` : text;
  };

  const content = tables
    .map((table) =>
      [
        table.label,
        table.columns.map((column) => escapeCell(column.label)).join(";"),
        ...table.rows.map((row) =>
          table.columns.map((column) => escapeCell(row[column.key])).join(";"),
        ),
      ].join("\n"),
    )
    .join("\n\n");

  const blob = new Blob([`﻿${content}`], {
    type: "text/csv;charset=utf-8",
  });

  triggerDownload(blob, `${fileName}.csv`);
};

export type ReportHeading = {
  periodo: string;
  sala: string;
  sensor: string;
  emitidoEm: string;
  granularidade: string;
  leituras: number;
  alertas: number;
  violacoes: number;
};

const PAGE_MARGIN = 14;
const INK = [15, 23, 42] as const;
const INK_SOFT = [71, 85, 105] as const;
const INK_FAINT = [148, 163, 184] as const;
const HEADER_FILL = [226, 232, 240] as const;

const pdfCell = (value: ReportCell) =>
  value === null || value === undefined || value === ""
    ? "—"
    : typeof value === "number"
      ? value.toLocaleString("pt-BR")
      : String(value);

const lastTableBottom = (doc: jsPDF, fallback: number) =>
  (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    ?.finalY ?? fallback;

const drawHeading = (doc: jsPDF, heading: ReportHeading) => {
  doc.setFontSize(15);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text("Relatório de monitoramento — CEOM", PAGE_MARGIN, PAGE_MARGIN + 4);

  const linhas: [string, string][] = [
    ["Período", heading.periodo],
    ["Sala", heading.sala],
    ["Sensor", heading.sensor],
    ["Resolução", heading.granularidade],
    ["Emitido em", heading.emitidoEm],
    [
      "Volume",
      `${heading.leituras.toLocaleString("pt-BR")} leituras · ${heading.alertas.toLocaleString("pt-BR")} alertas · ${heading.violacoes.toLocaleString("pt-BR")} violações`,
    ],
  ];

  doc.setFontSize(9);

  let y = PAGE_MARGIN + 12;
  for (const [rotulo, valor] of linhas) {
    doc.setTextColor(INK_FAINT[0], INK_FAINT[1], INK_FAINT[2]);
    doc.text(`${rotulo}:`, PAGE_MARGIN, y);
    doc.setTextColor(INK_SOFT[0], INK_SOFT[1], INK_SOFT[2]);
    doc.text(valor, PAGE_MARGIN + 24, y);
    y += 5;
  }

  return y + 2;
};

const drawFooters = (doc: jsPDF, emitidoEm: string) => {
  const total = doc.getNumberOfPages();
  const { width, height } = doc.internal.pageSize;

  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(INK_FAINT[0], INK_FAINT[1], INK_FAINT[2]);
    doc.text(`CEOM · ${emitidoEm}`, PAGE_MARGIN, height - 8);
    doc.text(`${page} / ${total}`, width - PAGE_MARGIN, height - 8, {
      align: "right",
    });
  }
};

export const downloadPdf = (
  fileName: string,
  tables: ReportTable[],
  heading: ReportHeading,
) => {
  if (tables.length === 0) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageHeight = doc.internal.pageSize.height;

  let cursor = drawHeading(doc, heading);

  for (const table of tables) {
    if (cursor > pageHeight - 40) {
      doc.addPage();
      cursor = PAGE_MARGIN;
    }

    doc.setFontSize(11);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(table.label, PAGE_MARGIN, cursor + 6);

    if (table.rows.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(INK_FAINT[0], INK_FAINT[1], INK_FAINT[2]);
      doc.text(
        "Sem dados para o filtro selecionado.",
        PAGE_MARGIN,
        cursor + 12,
      );
      cursor += 18;
      continue;
    }

    autoTable(doc, {
      startY: cursor + 9,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 16 },
      theme: "grid",
      head: [table.columns.map((column) => column.label)],
      body: table.rows.map((row) =>
        table.columns.map((column) => pdfCell(row[column.key])),
      ),
      styles: {
        fontSize: 8,
        cellPadding: 1.6,
        textColor: [INK_SOFT[0], INK_SOFT[1], INK_SOFT[2]],
        lineColor: [203, 213, 225],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [HEADER_FILL[0], HEADER_FILL[1], HEADER_FILL[2]],
        textColor: [INK[0], INK[1], INK[2]],
        fontStyle: "bold",
      },
      columnStyles: Object.fromEntries(
        table.columns.map((column, index) => [
          index,
          { halign: column.align === "right" ? "right" : "left" },
        ]),
      ),
    });

    cursor = lastTableBottom(doc, cursor + 20) + 8;
  }

  drawFooters(doc, heading.emitidoEm);
  doc.save(`${fileName}.pdf`);
};

export const reportFileName = (from: string, to: string) => {
  const slug = (value: string) => value.replace(/\//g, "-");
  const range = from && to ? `_${slug(from)}_a_${slug(to)}` : "";

  return `relatorio_ceom${range}`;
};
