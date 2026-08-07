import xlsxPkg from "xlsx";
const XLSX = xlsxPkg;
import fs from "node:fs";
import path from "node:path";
import { mapCategory } from "./categoryMap";
import { extractSize, extractModelType, baseName } from "./extract";
import { cleanString, classifyCode, normalizeDate, toNumber } from "./normalize";
import { clusterProducts, type Clusterable } from "./cluster";

const INPUT_FILE = process.argv[2] ?? "./productos.xls";
const OUTPUT_FILE = "./review-report.json";

interface RawRow {
  CODIGO: unknown;
  DETALLE: unknown;
  RUBRO: unknown;
  PRECIO_1: unknown;
  EXISTENCIA: unknown;
  MINIMO: unknown;
  COD_BARRA: unknown;
  CREADO: unknown;
  MODIFICADO: unknown;
}

interface ProcessedRow {
  index: number;
  name: string;
  base: string;
  rubro: string;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
  category: string;
  categoryWasFallback: boolean;
  model_size?: number;
  model_unit?: string;
  model_type?: string;
  needsReview: string[];
}

const wb = XLSX.readFile(INPUT_FILE, { cellDates: true });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rawRows: RawRow[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

const processed: ProcessedRow[] = rawRows.map((row, index) => {
  const name = cleanString(row.DETALLE);
  const rubro = cleanString(row.RUBRO);
  const { sku, barcode: barcodeFromCode } = classifyCode(cleanString(row.CODIGO));
  const barcodeFromCol = cleanString(row.COD_BARRA);
  const barcode = barcodeFromCol || barcodeFromCode;

  const { category, wasFallback } = mapCategory(rubro);
  const size = extractSize(name);
  const modelType = extractModelType(name);

  const needsReview: string[] = [];
  if (wasFallback) needsReview.push("rubro_sin_mapeo");
  if (!size.model_size || !size.model_unit) needsReview.push("model_size_unit_no_detectado");
  if (!modelType) needsReview.push("model_type_no_detectado");
  if (!barcode) needsReview.push("sin_barcode");

  return {
    index,
    name,
    base: baseName(name),
    rubro,
    sku,
    barcode,
    price: toNumber(row.PRECIO_1),
    stock: toNumber(row.EXISTENCIA),
    min_stock: toNumber(row.MINIMO),
    created_at: normalizeDate(row.CREADO),
    updated_at: normalizeDate(row.MODIFICADO) || normalizeDate(row.CREADO),
    category,
    categoryWasFallback: wasFallback,
    model_size: size.model_size,
    model_unit: size.model_unit,
    model_type: modelType,
    needsReview,
  };
});

const clusterInput: Clusterable[] = processed.map((r) => ({
  index: r.index,
  base: r.base,
  rubro: r.rubro,
}));

const clusters = clusterProducts(clusterInput);

const report = clusters.map((cluster) => {
  const members = cluster.memberIndexes.map((i) => processed[i]);
  return {
    suggested_product_name: titleCase(cluster.base || members[0].name),
    rubro: members[0].rubro,
    category: members[0].category,
    presentation_count: members.length,
    presentations: members.map((m) => ({
      name: m.name,
      sku: m.sku,
      barcode: m.barcode || null,
      price: m.price,
      stock: m.stock,
      min_stock: m.min_stock,
      model_size: m.model_size ?? null,
      model_unit: m.model_unit ?? null,
      model_type: m.model_type ?? "other",
      created_at: m.created_at,
      updated_at: m.updated_at,
      needs_review: m.needsReview,
    })),
  };
});

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), "utf-8");

const totalRows = processed.length;
const totalProducts = clusters.length;
const multiPresentation = clusters.filter((c) => c.memberIndexes.length > 1).length;
const rubroFallback = processed.filter((r) => r.categoryWasFallback).length;
const noSize = processed.filter((r) => !r.model_size || !r.model_unit).length;
const noModelType = processed.filter((r) => !r.model_type).length;
const noBarcode = processed.filter((r) => !r.barcode).length;

console.log(`
Filas leídas:            ${totalRows}
Productos sugeridos:      ${totalProducts}
  con 2+ presentaciones:  ${multiPresentation}
Presentaciones a revisar:
  rubro sin mapeo:        ${rubroFallback}
  sin model_size/unit:    ${noSize} (${((noSize / totalRows) * 100).toFixed(1)}%)
  sin model_type:         ${noModelType} (${((noModelType / totalRows) * 100).toFixed(1)}%)
  sin barcode real:       ${noBarcode} (${((noBarcode / totalRows) * 100).toFixed(1)}%)

Reporte completo -> ${path.resolve(OUTPUT_FILE)}
Revisalo/corregilo y después corré: npx tsx src/import-products/2-build.ts ./review-report.json
`);