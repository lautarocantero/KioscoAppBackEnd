import { describe, it, expect } from "vitest";
import { Workbook } from "exceljs";
import { analyzeWorkbook } from "../receiptImportService";

const HEADERS = ["CODIGO", "DETALLE", "RUBRO", "PRECIO_1", "EXISTENCIA", "MINIMO", "COD_BARRA", "CREADO", "MODIFICADO"];

async function buildWorkbookBuffer(rows: (string | number | Date)[][]): Promise<Buffer> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.addRow(HEADERS);
  rows.forEach((row) => sheet.addRow(row));
  // Fila totalmente vacía al final, como suelen dejar los exports reales.
  sheet.addRow([]);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

describe("analyzeWorkbook", () => {
  it("parsea un .xlsx real (generado con ExcelJS) a un reporte agrupado por producto", async () => {
    const createdAt = new Date("2026-01-15T00:00:00.000Z");
    const buffer = await buildWorkbookBuffer([
      ["7791234000019", "Coca Cola 500ml", "ALMACEN", 1500, 20, 5, "7791234000019", createdAt, createdAt],
      ["7791234000026", "Coca Cola 1L", "ALMACEN", 2200, 10, 3, "7791234000026", createdAt, createdAt],
    ]);

    const { report, stats } = await analyzeWorkbook(buffer);

    expect(stats.totalRows).toBe(2);
    expect(report.length).toBeGreaterThan(0);

    const presentation = report.flatMap((c) => c.presentations).find((p) => p.sku === "7791234000019");
    expect(presentation).toBeDefined();
    expect(presentation?.price).toBe(1500);
    expect(presentation?.stock).toBe(20);
    // La celda CREADO llega como Date nativo de ExcelJS, no como string.
    expect(presentation?.created_at).toBe(createdAt.toISOString());
  });

  it("descarta filas completamente vacías (ej. filas finales sobrantes del export)", async () => {
    const buffer = await buildWorkbookBuffer([
      ["7791234000019", "Coca Cola 500ml", "ALMACEN", 1500, 20, 5, "7791234000019", "", ""],
    ]);

    const { stats } = await analyzeWorkbook(buffer);

    expect(stats.totalRows).toBe(1);
  });

  it("usa defval '' para celdas ausentes (ej. sin COD_BARRA ni CODIGO tipo EAN)", async () => {
    const buffer = await buildWorkbookBuffer([
      ["SKU001", "Coca Cola 500ml", "ALMACEN", 1500, 20, 5, "", "", ""],
    ]);

    const { report } = await analyzeWorkbook(buffer);
    const presentation = report[0].presentations[0];

    expect(presentation.barcode).toBeNull();
  });
});
