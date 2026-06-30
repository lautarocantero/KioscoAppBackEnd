/*──────────────────────────────
📘 ProductVariantTypes
──────────────────────────────
📜 Propósito:
Tipados base y derivados para variantes de producto.
La variante representa UNA presentación comercial de un producto
(ej: Coca Cola Botella 2,25l / Coca Cola Lata 354ml).

🧩 Campos propios de la variante (NO del producto padre):
- Identificación:  _id, product_id, sku
- Presentación:    name, description (opcional), brand, model_type, model_size
- Imágenes:        image_url (opcional), gallery_urls
- Precios y Stock: price (venta), stock, min_stock
- Estado:          status → 'available' | 'out_of_stock' | 'unavailable'
                   (out_of_stock se calcula; available/unavailable son manuales)
- Fechas:          created_at, updated_at, expiration_date (opcional)
──────────────────────────────*/

declare module '@typings/productVariant' {

/*══════════════════════════════════════════════════════════════════════╗
║ 🔒 BASES PRIVADAS                                                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

type ProductVariantStatus = 'available' | 'out_of_stock' | 'unavailable';

interface ProductVariantEntity {
    // ── Identidad ──────────────────────────────────────────────────────
    _id:            string;
    product_id:     string;
    sku:            string;

    // ── Presentación ───────────────────────────────────────────────────
    name:           string;
    description:    string;          // opcional — vacío string si no aplica
    brand:          string;          // opcional — vacío string si no aplica
    model_type:     string;
    model_size:     string;          // ej: "2,25l" | "354ml" | "500g"

    // ── Imágenes ───────────────────────────────────────────────────────
    image_url:      string;          // opcional — vacío string si no aplica
    gallery_urls:   string[];

    // ── Precios y Stock ────────────────────────────────────────────────
    price:          number;          // precio de venta unitario
    stock:          number;          // unidades disponibles
    min_stock:      number;          // punto mínimo de reposición

    // ── Estado ─────────────────────────────────────────────────────────
    status:         ProductVariantStatus;

    // ── Fechas ─────────────────────────────────────────────────────────
    created_at:      string;
    updated_at:      string;
    expiration_date: string;         // opcional — vacío string si no aplica
}

interface ProductVariantRepository extends ProductVariantEntity {
    find(query: Partial<ProductVariantEntity>): Promise<ProductVariantEntity[]>;
    findOne(query: Partial<ProductVariantEntity>): Promise<ProductVariantEntity | null>;
    save(query?: Partial<ProductVariantEntity>, data?: Partial<ProductVariantEntity>): Promise<void>;
    remove(query?: Partial<ProductVariantEntity>): Promise<void>;
}

type ProductVariantPayloadUnknown = Record<keyof ProductVariantEntity, unknown>;

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS                                                         ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProductVariant        = ProductVariantEntity;
export type ProductVariantPublic  = Omit<ProductVariantEntity, ''>;
export type ProductVariantModelType = ProductVariantRepository;
export type ProductVariantPayload = ProductVariantPayloadUnknown;
export type ProductVariantStatus  = ProductVariantStatus;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA                                                            ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProductVariantSchemaType = ProductVariant;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOADS                                                          ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetProductVariantByIdPayload          = Pick<ProductVariantPayload, '_id'>;
export type GetProductVariantByProductIdPayload   = Pick<ProductVariantPayload, 'product_id'>;
export type GetProductVariantByStockPayload       = Pick<ProductVariantPayload, 'stock'>;
export type GetProductVariantByPricePayload       = Pick<ProductVariantPayload, 'price'>;
export type GetProductVariantByStatusPayload      = Pick<ProductVariantPayload, 'status'>;
export type GetProductVariantByModelSizePayload   = Pick<ProductVariantPayload, 'model_size'>;

export type CreateProductVariantPayload = Omit<ProductVariantPayload,
    '_id' | 'created_at' | 'updated_at' | 'status'
    // status se calcula al crear: si stock > 0 → 'available', si no → 'out_of_stock'
>;

export type EditProductVariantPayload = ProductVariantPayload;

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUESTS                                                          ║
╚══════════════════════════════════════════════════════════════════════╝*/

interface ProductVariantParams { variant_id: string; }
interface ProductIdParams      { product_id: string; }

export type GetProductVariantByIdRequest        = Request<ProductVariantParams, unknown, GetProductVariantByIdPayload>;
export type GetProductVariantByProductIdRequest = Request<ProductIdParams, unknown, GetProductVariantByProductIdPayload>;
export type GetProductVariantByStockRequest     = Request<ProductVariantParams, unknown, GetProductVariantByStockPayload>;
export type GetProductVariantByPriceRequest     = Request<ProductVariantParams, unknown, GetProductVariantByPricePayload>;
export type GetProductVariantByStatusRequest    = Request<ProductVariantParams, unknown, GetProductVariantByStatusPayload>;
export type GetProductVariantByModelSizeRequest = Request<ProductVariantParams, unknown, GetProductVariantByModelSizePayload>;
export type CreateProductVariantRequest         = Request<ProductVariantParams, unknown, CreateProductVariantPayload>;
export type DeleteProductVariantRequest         = Request<ProductVariantParams, unknown, GetProductVariantByIdPayload>;
export type EditProductVariantRequest           = Request<ProductVariantParams, unknown, EditProductVariantPayload>;

}