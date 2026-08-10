import * as XLSX from "xlsx";
import crypto from "node:crypto";
import { mapCategory } from "./categoryMap";
import { extractSize, extractModelType, baseName } from "./extract";
import { cleanString, classifyCode, normalizeDate, toNumber } from "./normalize";
import { clusterProducts } from "./cluster";
import { ProductMongo } from "../../schemas/productSchema";
import { PresentationMongo } from "../../schemas/presentationSchema";
import { ModelType, ModelUnit } from "../../typings/presentation/presentationEnum";
import { NeedsReviewReason, ReceiptDocAction } from "../../typings/receipt/receiptEnum";
import type {
  receiptRawRow,
  ReceiptReportCluster,
  ReceiptReportPresentation,
  ReceiptStatsType,
  ReceiptPendingReviewType,
  ReceiptPreviewResultType,
  ReceiptImportResultType,
  ReceiptBulkInsertResultType,
  ReceiptBulkWriteResultType,
  ReceiptMatchedPresentationDocType,
  Clusterable,
} from "@typings/receipt";
import type { Product } from "@typings/product";
import type { presentation as PresentationEntity } from "@typings/presentation";

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
║ 🎮 matchPresentations → matchea CADA presentation contra la BD SOLO   ║
║    por sku (columna CODIGO del excel). Sin match -> "create", con     ║
║    match -> "update" contra ese _id existente. Products no se tocan.  ║
╚══════════════════════════════════════════════════════════════════════╝*/
export async function matchPresentations(
  presentations: PresentationDoc[]
): Promise<ReceiptMatchedPresentationDocType[]> {
  const skus = presentations.map((p) => p.sku).filter(Boolean);

  const existing = skus.length > 0
    ? await PresentationMongo.find({ sku: { $in: skus } }, { _id: 1, sku: 1 }).lean()
    : [];

  const bySku = new Map(existing.map((e: any) => [e.sku, e._id]));

  return presentations.map((p) => {
    const existingId = p.sku ? bySku.get(p.sku) ?? null : null;
    return {
      ...p,
      action: existingId ? ReceiptDocAction.Update : ReceiptDocAction.Create,
      existingId,
    };
  });
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🎮 insertProducts → sin cambios respecto al comportamiento original:  ║
║    inserta, saltea duplicados por _id (en la práctica siempre nuevo). ║
╚══════════════════════════════════════════════════════════════════════╝*/
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function insertProducts(products: ProductDoc[]): Promise<ReceiptBulkInsertResultType> {
  const inserted: string[] = [];
  const skippedDuplicates: string[] = [];
  const failed: { _id: string; error: string }[] = [];

  const ids = products.map((d) => d._id);
  const existing = ids.length > 0 ? await ProductMongo.find({ _id: { $in: ids } }, { _id: 1 }).lean() : [];
  const existingIds = new Set(existing.map((e: any) => e._id));

  const toInsert = products.filter((d) => {
    if (existingIds.has(d._id)) { skippedDuplicates.push(d._id); return false; }
    return true;
  });

  const docsToInsert = toInsert.map(({ presentations: _presentations, ...rest }) => rest);

  for (const batch of chunk(docsToInsert, 500)) {
    try {
      await ProductMongo.insertMany(batch, { ordered: false });
      inserted.push(...batch.map((b: any) => b._id));
    } catch (err: any) {
      const writeErrors = err.writeErrors ?? [];
      for (const we of writeErrors) {
        const failedDoc = batch[we.index];
        failed.push({ _id: failedDoc?._id ?? "desconocido", error: we.errmsg ?? String(we) });
      }
      const failedIds = new Set(failed.map((f) => f._id));
      inserted.push(...batch.map((b: any) => b._id).filter((id: string) => !failedIds.has(id)));
    }
  }

  console.log(`[products] insertados: ${inserted.length} | duplicados: ${skippedDuplicates.length} | fallidos: ${failed.length}`);
  return { inserted, skippedDuplicates, failed };
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🎮 applyPresentations → inserta las "create" y actualiza las         ║
║    "update" (por existingId, campos vía $set). No toca product_id     ║
║    en un update: la presentation sigue colgada del producto que ya    ║
║    tenía en la BD.                                                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
async function applyPresentations(
  presentations: ReceiptMatchedPresentationDocType[],
  failedProductIds: Set<string>
): Promise<ReceiptBulkWriteResultType> {
  const created: string[] = [];
  const updated: string[] = [];
  const failed: { _id: string; error: string }[] = [];

  const toCreate = presentations
    .filter((p) => p.action === ReceiptDocAction.Create && !failedProductIds.has(p.product_id))
    .map(({ action, existingId, ...rest }) => rest);

  for (const batch of chunk(toCreate, 500)) {
    try {
      await PresentationMongo.insertMany(batch, { ordered: false });
      created.push(...batch.map((b: any) => b._id));
    } catch (err: any) {
      const writeErrors = err.writeErrors ?? [];
      for (const we of writeErrors) {
        const failedDoc = batch[we.index];
        failed.push({ _id: failedDoc?._id ?? "desconocido", error: we.errmsg ?? String(we) });
      }
      const failedIds = new Set(failed.map((f) => f._id));
      created.push(...batch.map((b: any) => b._id).filter((id: string) => !failedIds.has(id)));
    }
  }

  const toUpdate = presentations.filter((p) => p.action === ReceiptDocAction.Update && p.existingId);

  for (const batch of chunk(toUpdate, 500)) {
    // product_id se excluye del $set: un update no debe mover la
    // presentation a otro producto, solo refrescar sus datos.
    const ops = batch.map((p) => {
      const { _id, action, existingId, product_id, ...fields } = p;
      return { updateOne: { filter: { _id: existingId }, update: { $set: fields } } };
    });

    try {
      await PresentationMongo.bulkWrite(ops, { ordered: false });
      updated.push(...batch.map((p) => p.existingId as string));
    } catch (err: any) {
      const writeErrors = err.writeErrors ?? [];
      const failedIndexes = new Set(writeErrors.map((we: any) => we.index));
      batch.forEach((p, i) => {
        if (failedIndexes.has(i)) {
          const we = writeErrors.find((w: any) => w.index === i);
          failed.push({ _id: p.existingId as string, error: we?.errmsg ?? String(we) });
        } else {
          updated.push(p.existingId as string);
        }
      });
    }
  }

  console.log(`[presentations] creadas: ${created.length} | actualizadas: ${updated.length} | fallidas: ${failed.length}`);
  return { created, updated, failed };
}

export async function applyReceiptDocs(
  products: ProductDoc[],
  presentations: ReceiptMatchedPresentationDocType[]
) {
  const productResult = await insertProducts(products);
  const failedProductIds = new Set(productResult.failed.map((f) => f._id));
  const presentationResult = await applyPresentations(presentations, failedProductIds);
  return { products: productResult, presentations: presentationResult };
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🎮 previewReceiptImport → analiza + matchea presentations, SIN        ║
║    insertar/actualizar nada.                                          ║
╚══════════════════════════════════════════════════════════════════════╝*/
export async function previewReceiptImport(buffer: Buffer): Promise<ReceiptPreviewResultType> {
  const { report, stats } = analyzeWorkbook(buffer);
  const { products, presentations, pendingReview } = buildDocsFromReport(report);
  const matchedPresentations = await matchPresentations(presentations);
  return { stats, pendingReview, products, presentations: matchedPresentations };
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🎮 confirmReceiptImport → recibe los docs del preview y los aplica.   ║
╚══════════════════════════════════════════════════════════════════════╝*/
export async function confirmReceiptImport(
  products: ProductDoc[],
  presentations: ReceiptMatchedPresentationDocType[]
) {
  return applyReceiptDocs(products, presentations);
}