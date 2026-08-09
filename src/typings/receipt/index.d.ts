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

interface BulkInsertResult {
    inserted:           string[];
    skippedDuplicates:  string[];
    failed:             { _id: string; error: string }[];
}

interface ReceiptImportResult {
    stats:         ReceiptStats;
    pendingReview: ReceiptPendingReview[];
    insertResult: {
        products:      BulkInsertResult;
        presentations: BulkInsertResult;
    };
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
export type ReceiptBulkInsertResult   = BulkInsertResult;
export type ReceiptImportResultType   = ReceiptImportResult;
export type ReceiptProductDocType      = ReceiptProductDoc;
export type ReceiptPresentationDocType = ReceiptPresentationDoc;

}