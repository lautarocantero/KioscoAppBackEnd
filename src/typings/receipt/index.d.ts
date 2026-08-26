import { ModelType, ModelUnit, PresentationCategory } from "../presentation/presentationEnum";
import { NeedsReviewReason } from "./receiptEnum";
import type { Product } from "@typings/product";
import type { presentation as PresentationEntity } from "@typings/presentation";

declare module '@typings/receipt' {

/*══════════════════════════════════════════════════════════════════════╗
║ 🔒 BASES PRIVADAS                                                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

interface RawRow {
    CODIGO:      unknown;
    DETALLE:     unknown;
    RUBRO:       unknown;
    PRECIO_1:    unknown;
    EXISTENCIA:  unknown;
    MINIMO:      unknown;
    COD_BARRA:   unknown;
    CREADO:      unknown;
    MODIFICADO:  unknown;
}

interface ReportPresentation {
    name:         string;
    sku:          string;
    barcode:      string | null;
    price:        number;
    stock:        number;
    min_stock:    number;
    model_size:   number | null;
    model_unit:   ModelUnit | null;
    model_type:   ModelType;
    created_at:   string;
    updated_at:   string;
    needs_review: NeedsReviewReason[];
}

interface ReportCluster {
    suggested_product_name: string;
    rubro:                  string;
    category:                PresentationCategory;
    presentation_count:      number;
    presentations:           ReportPresentation[];
}

interface ReceiptStats {
    totalRows:         number;
    totalProducts:     number;
    multiPresentation: number;
    rubroFallback:     number;
    noSize:            number;
    noModelType:       number;
    noBarcode:         number;
}

interface ReceiptPendingReview {
    product:      string;
    presentation: string;
    reasons:      NeedsReviewReason[];
}

interface ReceiptBulkInsertResult {
    inserted:          string[];
    skippedDuplicates: string[];
    failed:            { _id: string; error: string }[];
}

interface ReceiptBulkWriteResult {
    created: string[];
    updated: string[];
    unchanged: string[];
    failed:  { _id: string; error: string }[];
}

interface MatchedPresentationDoc extends ReceiptPresentationDoc {
    action:           ReceiptDocAction;
    existingId:       string | null;
    existingProductId: string | null;
}

// Preview: además de products/presentations a aplicar, expone
// productsAlreadyExisting (ids reales de productos que ya estaban en la
// BD, resueltos por resolveProductInserts) para poder mostrar el total
// real de productos del archivo, no solo los nuevos.
interface PreviewResultV2 {
    stats:                    ReceiptStats;
    pendingReview:            ReceiptPendingReview[];
    products:                 ReceiptProductDoc[];
    presentations:            MatchedPresentationDoc[];
    productsAlreadyExisting:  string[];
}

// El front reenvía productsAlreadyExisting tal cual al confirmar (igual
// que ya hace con stats/pendingReview), y el controller lo devuelve en
// el resultado final sin volver a calcularlo.
interface ReceiptImportResultV2 {
    stats:                    ReceiptStats;
    pendingReview:            ReceiptPendingReview[];
    insertResult: {
        products:      ReceiptBulkInsertResult;
        presentations: ReceiptBulkWriteResult;
    };
    productsAlreadyExisting:  string[];
    // Unidades de catálogo (productos + presentaciones nuevas) que no se
    // insertaron por haber alcanzado el tope del plan (ver planLimits) —
    // 0 en Deluxe (sin tope) o cuando el archivo entró completo.
    skippedByPlanLimit:       number;
}

// Doc de producto en memoria, previo a insertar: extiende la entidad real
// con "presentations" (los ids relacionados), que se descarta antes del
// insertMany porque ProductMongoSchema no lo tiene.
interface ReceiptProductDoc extends Product {
    presentations: string[];
}

// El doc de presentation a insertar es exactamente la entidad real,
// no hace falta redefinirlo.
type ReceiptPresentationDoc = PresentationEntity;

export interface ExtractedSize {
  model_size?: number;
  model_unit?: ModelUnit;
  matchedText?: string;
}

export interface Clusterable {
  index: number;
  base: string;
  rubro: string;
}

export interface Cluster {
  base: string;
  memberIndexes: number[];
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS                                                         ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type receiptRawRow             = RawRow;
export type ReceiptReportPresentation = ReportPresentation;
export type ReceiptReportCluster      = ReportCluster;
export type ReceiptStatsType          = ReceiptStats;
export type ReceiptPendingReviewType  = ReceiptPendingReview;
export type ReceiptBulkInsertResultType       = ReceiptBulkInsertResult;
export type ReceiptBulkWriteResultType        = ReceiptBulkWriteResult;
export type ReceiptMatchedPresentationDocType = MatchedPresentationDoc;
export type ReceiptPreviewResultType          = PreviewResultV2;
export type ReceiptImportResultType           = ReceiptImportResultV2;

}