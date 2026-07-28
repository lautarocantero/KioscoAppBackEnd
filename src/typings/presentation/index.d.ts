import { PresentationCategory } from "./presentationEnum";

declare module '@typings/presentation' {

/*══════════════════════════════════════════════════════════════════════╗
║ 🔒 BASES PRIVADAS                                                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

type PresentationStatus = 'available' | 'out_of_stock' | 'unavailable';

interface PresentationEntity {
    // ── Identidad ──────────────────────────────────────────────────────
    _id:            string;
    product_id:     string;
    sku:            string;
    barcode:        string;
    // ── Presentación ───────────────────────────────────────────────────
    name:           string;
    description:    string;          // opcional — vacío string si no aplica
    brand:          string;          // opcional — vacío string si no aplica
    model_type:     string;
    model_size:     string;          // ej: "2,25l" | "354ml" | "500g"

    // ── Clasificación ──────────────────────────────────────────────────
    category:       PresentationCategory[];   // un producto puede tener varias

    // ── Imágenes ───────────────────────────────────────────────────────
    image_url:      string;          // opcional — vacío string si no aplica

    // ── Precios y Stock ────────────────────────────────────────────────
    price:          number;          // precio de venta unitario
    stock:          number;          // unidades disponibles
    min_stock:      number;          // punto mínimo de reposición

    // ── Estado ─────────────────────────────────────────────────────────
    status:         PresentationStatus;

    // ── Fechas ─────────────────────────────────────────────────────────
    created_at:      string;
    updated_at:      string;
    expiration_date: string;         // opcional — vacío string si no aplica
}

interface PresentationRepository extends PresentationEntity {
    find(query: Partial<PresentationEntity>): Promise<PresentationEntity[]>;
    findOne(query: Partial<PresentationEntity>): Promise<PresentationEntity | null>;
    save(query?: Partial<PresentationEntity>, data?: Partial<PresentationEntity>): Promise<void>;
    remove(query?: Partial<PresentationEntity>): Promise<void>;
}

type PresentationPayloadUnknown = Record<keyof PresentationEntity, unknown>;

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS                                                         ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type presentation        = PresentationEntity;
export type PresentationPublic  = Omit<PresentationEntity, ''>;
export type PresentationModelType = PresentationRepository;
export type PresentationPayload = PresentationPayloadUnknown;
export type PresentationStatus  = PresentationStatus;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA                                                            ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type PresentationSchemaType = presentation;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOADS                                                          ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetPresentationByIdPayload          = Pick<PresentationPayload, '_id'>;
export type GetPresentationByBarcodePayload     = Pick<PresentationPayload, 'barcode'>;
export type GetPresentationByProductIdPayload   = Pick<PresentationPayload, 'product_id'>;
export type GetPresentationByStockPayload       = Pick<PresentationPayload, 'stock'>;
export type GetPresentationByPricePayload       = Pick<PresentationPayload, 'price'>;
export type GetPresentationByStatusPayload      = Pick<PresentationPayload, 'status'>;
export type GetPresentationByCategoryPayload    = Pick<PresentationPayload, 'category'>;
export type GetPresentationByModelSizePayload   = Pick<PresentationPayload, 'model_size'>;

export type CreatePresentationPayload = Omit<PresentationPayload,
    '_id' | 'created_at' | 'updated_at' | 'status'
    // status se calcula al crear: si stock > 0 → 'available', si no → 'out_of_stock'
>;

export type EditPresentationPayload = PresentationPayload;

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUESTS                                                          ║
╚══════════════════════════════════════════════════════════════════════╝*/

interface PresentationParams { presentation_id: string; }
interface ProductIdParams      { product_id: string; }
interface BarcodeParams        { barcode: string; }

export type GetPresentationByIdRequest        = Request<PresentationParams, unknown, GetPresentationByIdPayload>;
export type GetPresentationByBarcodeRequest   = Request<BarcodeParams, unknown, GetPresentationByBarcodePayload>;
export type GetPresentationByProductIdRequest = Request<ProductIdParams, unknown, GetPresentationByProductIdPayload>;

export type GetPresentationByStockRequest     = Request<PresentationParams, unknown, GetPresentationByStockPayload>;
export type GetPresentationByPriceRequest     = Request<PresentationParams, unknown, GetPresentationByPricePayload>;
export type GetPresentationByStatusRequest    = Request<PresentationParams, unknown, GetPresentationByStatusPayload>;
export type GetPresentationByModelSizeRequest = Request<PresentationParams, unknown, GetPresentationByModelSizePayload>;
export type GetPresentationByCategoryRequest = Request<PresentationParams, unknown, GetPresentationByCategoryPayload>;
export type CreatePresentationRequest         = Request<PresentationParams, unknown, CreatePresentationPayload>;
export type DeletePresentationRequest         = Request<PresentationParams, unknown, GetPresentationByIdPayload>;
export type EditPresentationRequest           = Request<PresentationParams, unknown, EditPresentationPayload>;

}