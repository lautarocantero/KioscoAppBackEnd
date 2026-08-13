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

  // Traemos también product_id: si esta presentation ya existe, necesitamos
  // saber a qué producto real pertenece para resolver el cluster completo
  // (ver resolveProductInserts) y no crear un producto duplicado.
  const existing = skus.length > 0
    ? await PresentationMongo.find({ sku: { $in: skus } }, { _id: 1, sku: 1, product_id: 1 }).lean()
    : [];

  const bySku = new Map(existing.map((e: any) => [e.sku, e]));

  return presentations.map((p) => {
    const match: any = p.sku ? bySku.get(p.sku) : undefined;
    return {
      ...p,
      action: match ? ReceiptDocAction.Update : ReceiptDocAction.Create,
      existingId: match ? match._id : null,
      existingProductId: match ? match.product_id : null,
    };
  });
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🎮 resolveProductInserts → si CUALQUIER presentation de un cluster    ║
║    matcheó por sku contra la BD, el producto de ese cluster YA        ║
║    EXISTE (aunque el resto de sus presentations sean nuevas). En ese  ║
║    caso: no insertamos el producto de nuevo, y reasignamos el         ║
║    product_id real de la BD a TODAS las presentations del cluster     ║
║    (matcheadas o no), para que las nuevas cuelguen del producto       ║
║    correcto en vez de un product_id placeholder que nunca se inserta.║
╚══════════════════════════════════════════════════════════════════════╝*/
function resolveProductInserts(
  products: ProductDoc[],
  matchedPresentations: ReceiptMatchedPresentationDocType[]
): {
  productsToInsert: ProductDoc[];
  productsAlreadyExisting: string[];
  resolvedPresentations: ReceiptMatchedPresentationDocType[];
} {
  const resolvedProductIdByPlaceholder = new Map<string, string>();

  for (const p of matchedPresentations) {
    if (p.existingProductId && !resolvedProductIdByPlaceholder.has(p.product_id)) {
      resolvedProductIdByPlaceholder.set(p.product_id, p.existingProductId as string);
    }
  }

  const resolvedPresentations = matchedPresentations.map((p) => {
    const resolvedId = resolvedProductIdByPlaceholder.get(p.product_id);
    return resolvedId ? { ...p, product_id: resolvedId } : p;
  });

  const productsAlreadyExisting: string[] = [];
  const productsToInsert = products.filter((prod) => {
    const resolvedId = resolvedProductIdByPlaceholder.get(prod._id);
    if (resolvedId) {
      productsAlreadyExisting.push(resolvedId);
      return false;
    }
    return true;
  });

  return { productsToInsert, productsAlreadyExisting, resolvedPresentations };
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🎮 insertProducts → inserta los productos genuinamente nuevos (los    ║
║    que ya existían fueron filtrados antes por resolveProductInserts). ║
║    El chequeo por _id acá queda como red de seguridad, no como el     ║
║    mecanismo principal de dedupe.                                     ║
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
║ 🎮 presentationHasChanges → compara los campos "editables" del doc    ║
║    entrante contra el doc existente en Mongo. Si nada difiere, el     ║
║    update se saltea (no se escribe ni se cuenta como "actualizada"). ║
╚══════════════════════════════════════════════════════════════════════╝*/
const PRESENTATION_FIELDS_TO_COMPARE = [
  "sku",
  "barcode",
  "name",
  "description",
  "brand",
  "model_type",
  "model_size",
  "model_unit",
  "category",
  "sale_type",
  "image_url",
  "price",
  "stock",
  "min_stock",
  "status",
  "updated_at",
  "is_perishable",
  "expiration_date",
] as const;

function presentationHasChanges(existing: any, incoming: Record<string, any>): boolean {
  return PRESENTATION_FIELDS_TO_COMPARE.some((field) => {
    const a = existing?.[field];
    const b = incoming[field];
    if (Array.isArray(a) || Array.isArray(b)) {
      return JSON.stringify(a ?? []) !== JSON.stringify(b ?? []);
    }
    return a !== b;
  });
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🎮 applyPresentations → inserta las "create" y actualiza SOLO las     ║
║    "update" cuyo contenido realmente difiere del doc existente (por   ║
║    existingId, campos vía $set). No toca product_id ni created_at en  ║
║    un update: la presentation sigue colgada del producto que ya       ║
║    tenía en la BD y conserva su fecha de alta original.               ║
╚══════════════════════════════════════════════════════════════════════╝*/
async function applyPresentations(
  presentations: ReceiptMatchedPresentationDocType[],
  failedProductIds: Set<string>
): Promise<ReceiptBulkWriteResultType> {
  const created: string[] = [];
  const updated: string[] = [];
  const unchanged: string[] = [];
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

  const updateCandidates = presentations.filter((p) => p.action === ReceiptDocAction.Update && p.existingId);

  // Traemos los docs actuales para poder comparar campo por campo y
  // descartar del bulkWrite los que no cambiaron en absoluto.
  const existingIds = updateCandidates.map((p) => p.existingId as string);
  const existingDocs = existingIds.length > 0
    ? await PresentationMongo.find({ _id: { $in: existingIds } }).lean()
    : [];
  const existingById = new Map(existingDocs.map((d: any) => [d._id, d]));

  const toUpdate: ReceiptMatchedPresentationDocType[] = [];
  for (const p of updateCandidates) {
    // created_at nunca debe pisarse en un update, así que ni siquiera
    // entra en la comparación ni en el $set.
    const { _id, action, existingId, product_id, created_at, ...fields } = p;
    const existing = existingById.get(p.existingId);

    if (existing && !presentationHasChanges(existing, fields)) {
      unchanged.push(p.existingId as string);
    } else {
      toUpdate.push(p);
    }
  }

  for (const batch of chunk(toUpdate, 500)) {
    // product_id y created_at se excluyen del $set: un update no debe
    // mover la presentation a otro producto ni pisar su fecha de alta.
    const ops = batch.map((p) => {
      const { _id, action, existingId, product_id, created_at, ...fields } = p;
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

  console.log(
    `[presentations] creadas: ${created.length} | actualizadas: ${updated.length} | sin cambios: ${unchanged.length} | fallidas: ${failed.length}`
  );
  return { created, updated, unchanged, failed };
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
  const { productsToInsert, productsAlreadyExisting, resolvedPresentations } = resolveProductInserts(
    products,
    matchedPresentations
  );
  return {
    stats,
    pendingReview,
    products: productsToInsert,
    presentations: resolvedPresentations,
    productsAlreadyExisting,
  };
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