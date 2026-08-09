import * as XLSX from "xlsx";
import crypto from "node:crypto";
import { mapCategory } from "./categoryMap";
import { extractSize, extractModelType, baseName } from "./extract";
import { cleanString, classifyCode, normalizeDate, toNumber } from "./normalize";
import { clusterProducts } from "./cluster";
import { ProductMongo } from "../../schemas/productSchema";
import { PresentationMongo } from "../../schemas/presentationSchema";
import { ModelType, ModelUnit } from "../../typings/presentation/presentationEnum";
import { NeedsReviewReason } from "../../typings/receipt/receiptEnum";
import type {
  receiptRawRow,
  ReceiptReportCluster,
  ReceiptReportPresentation,
  ReceiptStatsType,
  ReceiptPendingReviewType,
  ReceiptImportResultType,
  Clusterable,
} from "@typings/receipt";
import type { Product } from "@typings/product";
import type { presentation as PresentationEntity } from "@typings/presentation";

// El producto en memoria necesita "presentations" para relacionar antes de insertar;
// el doc real de Mongo NO lo tiene (se descarta en insertDocs, ver nota ahí abajo).
type ProductDoc = Product & { presentations: string[] };
type PresentationDoc = PresentationEntity;

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🎮 analyzeWorkbook → xls en memoria -> reporte agrupado por producto  ║
╚══════════════════════════════════════════════════════════════════════╝*/
export function analyzeWorkbook(buffer: Buffer): { report: ReceiptReportCluster[]; stats: ReceiptStatsType } {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows: receiptRawRow[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const processed = rawRows.map((row, index) => {
    const name = cleanString(row.DETALLE);
    const rubro = cleanString(row.RUBRO);
    const { sku, barcode: barcodeFromCode } = classifyCode(cleanString(row.CODIGO));
    const barcode = cleanString(row.COD_BARRA) || barcodeFromCode;
    const { category, wasFallback } = mapCategory(rubro);
    const size = extractSize(name);
    const modelType = extractModelType(name);

    const needsReview: NeedsReviewReason[] = [];
    if (wasFallback) needsReview.push(NeedsReviewReason.RubroSinMapeo);
    if (!size.model_size || !size.model_unit) needsReview.push(NeedsReviewReason.ModelSizeUnitNoDetectado);
    if (!modelType) needsReview.push(NeedsReviewReason.ModelTypeNoDetectado);
    if (!barcode) needsReview.push(NeedsReviewReason.SinBarcode);

    return {
      index, name, base: baseName(name), rubro, sku, barcode,
      price: toNumber(row.PRECIO_1), stock: toNumber(row.EXISTENCIA), min_stock: toNumber(row.MINIMO),
      created_at: normalizeDate(row.CREADO),
      updated_at: normalizeDate(row.MODIFICADO) || normalizeDate(row.CREADO),
      category, categoryWasFallback: wasFallback,
      model_size: size.model_size, model_unit: size.model_unit, model_type: modelType,
      needsReview,
    };
  });

  const clusterInput: Clusterable[] = processed.map((r) => ({ index: r.index, base: r.base, rubro: r.rubro }));
  const clusters = clusterProducts(clusterInput);

  const report: ReceiptReportCluster[] = clusters.map((cluster) => {
    const members = cluster.memberIndexes.map((i) => processed[i]);
    return {
      suggested_product_name: titleCase(cluster.base || members[0].name),
      rubro: members[0].rubro,
      category: members[0].category,
      presentation_count: members.length,
      presentations: members.map((m): ReceiptReportPresentation => ({
        name: m.name, sku: m.sku, barcode: m.barcode || null, price: m.price, stock: m.stock,
        min_stock: m.min_stock, model_size: m.model_size ?? null, model_unit: m.model_unit ?? null,
        model_type: m.model_type ?? ModelType.Other, created_at: m.created_at, updated_at: m.updated_at,
        needs_review: m.needsReview,
      })),
    };
  });

  const totalRows = processed.length;
  const stats: ReceiptStatsType = {
    totalRows,
    totalProducts: clusters.length,
    multiPresentation: clusters.filter((c) => c.memberIndexes.length > 1).length,
    rubroFallback: processed.filter((r) => r.categoryWasFallback).length,
    noSize: processed.filter((r) => !r.model_size || !r.model_unit).length,
    noModelType: processed.filter((r) => !r.model_type).length,
    noBarcode: processed.filter((r) => !r.barcode).length,
  };

  return { report, stats };
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🎮 buildDocsFromReport → reporte -> docs listos para Mongo            ║
╚══════════════════════════════════════════════════════════════════════╝*/
export function buildDocsFromReport(clusters: ReceiptReportCluster[]) {
  const products: ProductDoc[] = [];
  const presentations: PresentationDoc[] = [];
  const pendingReview: ReceiptPendingReviewType[] = [];

  for (const cluster of clusters) {
    const productId = crypto.randomUUID();
    const dates = cluster.presentations.flatMap((p) => [p.created_at, p.updated_at]).filter(Boolean).sort();
    const created_at = dates[0] ?? new Date().toISOString();
    const updated_at = dates[dates.length - 1] ?? created_at;
    const presentationIds = cluster.presentations.map(() => crypto.randomUUID());

    products.push({
      _id: productId,
      name: cluster.suggested_product_name,
      description: cluster.suggested_product_name,
      created_at,
      updated_at,
      image_url: "",
      brand: "",
      presentations: presentationIds,
    });

    cluster.presentations.forEach((p, i) => {
      presentations.push({
        _id: presentationIds[i],
        product_id: productId,
        sku: p.sku,
        barcode: p.barcode ?? "",
        name: p.name,
        description: "",
        brand: "",
        model_type: p.model_type || ModelType.Other,
        model_size: p.model_size ?? 1,
        model_unit: p.model_unit ?? ModelUnit.Units,
        category: [cluster.category],
        sale_type: "unit",
        image_url: "",
        price: p.price,
        stock: p.stock,
        min_stock: p.min_stock,
        status: p.stock > 0 ? "available" : "out_of_stock",
        created_at: p.created_at || created_at,
        updated_at: p.updated_at || updated_at,
        is_perishable: false,
        expiration_date: "",
      });

      if (p.needs_review.length > 0) {
        pendingReview.push({ product: cluster.suggested_product_name, presentation: p.name, reasons: p.needs_review });
      }
    });
  }

  return { products, presentations, pendingReview };
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🎮 insertDocs → inserta en Mongo (sin conectar/desconectar: la app     ║
║    ya mantiene la conexión abierta a nivel global)                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function bulkInsert<T extends { _id: string }>(model: any, docs: T[], label: string) {
  const inserted: string[] = [];
  const skippedDuplicates: string[] = [];
  const failed: { _id: string; error: string }[] = [];

  const ids = docs.map((d) => d._id);
  const existing = await model.find({ _id: { $in: ids } }, { _id: 1 }).lean();
  const existingIds = new Set(existing.map((e: any) => e._id));

  const toInsert = docs.filter((d) => {
    if (existingIds.has(d._id)) { skippedDuplicates.push(d._id); return false; }
    return true;
  });

  for (const batch of chunk(toInsert, 500)) {
    try {
      await model.insertMany(batch, { ordered: false });
      inserted.push(...batch.map((b) => b._id));
    } catch (err: any) {
      const writeErrors = err.writeErrors ?? [];
      for (const we of writeErrors) {
        const failedDoc = batch[we.index];
        failed.push({ _id: failedDoc?._id ?? "desconocido", error: we.errmsg ?? String(we) });
      }
      const failedIds = new Set(failed.map((f) => f._id));
      inserted.push(...batch.map((b) => b._id).filter((id) => !failedIds.has(id)));
    }
  }

  console.log(`[${label}] insertados: ${inserted.length} | duplicados: ${skippedDuplicates.length} | fallidos: ${failed.length}`);
  return { inserted, skippedDuplicates, failed };
}

export async function insertDocs(products: ProductDoc[], presentations: PresentationDoc[]) {
  // ProductMongoSchema no tiene "presentations" -> se descarta antes de insertar,
  // la relación vive del lado de la presentación vía "product_id".
  // (esto se estaba haciendo en el script 3 original y se había perdido en la unificación anterior)
  const productsToInsert = products.map(({ presentations: _presentations, ...rest }) => rest);

  const productResult = await bulkInsert(ProductMongo, productsToInsert, "products");
  const failedProductIds = new Set(productResult.failed.map((f) => f._id));
  const validPresentations = presentations.filter((p) => !failedProductIds.has(p.product_id));
  const presentationResult = await bulkInsert(PresentationMongo, validPresentations, "presentations");
  return { products: productResult, presentations: presentationResult };
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🎮 processReceiptFile → orquestador único, esto llama el controller   ║
╚══════════════════════════════════════════════════════════════════════╝*/
export async function processReceiptFile(buffer: Buffer): Promise<ReceiptImportResultType> {
  const { report, stats } = analyzeWorkbook(buffer);
  const { products, presentations, pendingReview } = buildDocsFromReport(report);
  const insertResult = await insertDocs(products, presentations);
  return { stats, pendingReview, insertResult };
}