/*──────────────────────────────
📘 ProductVariantTypes — rediseñado
──────────────────────────────
📜 Propósito:
Tipados base y derivados para variantes de producto.
La variante representa UNA presentación comercial de un producto
(ej: Coca Cola Botella 2,25l / Coca Cola Lata 354ml).

🧩 Campos propios de la variante (NO del producto padre):
- Identificación:  _id, product_id, sku, barcode
- Presentación:    name, description (opcional), net_content
- Precios:         price (venta), purchase_price (compra al proveedor)
- Stock:           stock_current, stock_available, reorder_point
- Estado:          status → 'available' | 'out_of_stock' | 'unavailable'
                   (out_of_stock se calcula; available/unavailable son manuales)
- Fechas:          created_at, updated_at, expiration_date (opcional)
- Proveedores:     supplier_ids → string[] (referencias a IDs del módulo Providers)

🗑️ Campos eliminados respecto a la versión anterior:
- brand       → vive en el producto padre
- image_url   → sin hosting por ahora
- gallery_urls → sin hosting por ahora
- model_type  → reemplazado por net_content (más genérico)
- model_size  → reemplazado por net_content
- min_stock   → renombrado a reorder_point (más semántico)
- stock       → renombrado a stock_current
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
    barcode:        string;

    // ── Presentación ───────────────────────────────────────────────────
    name:           string;
    description:    string;          // opcional — vacío string si no aplica
    net_content:    string;          // ej: "2,25l" | "354ml" | "500g"

    // ── Precios ────────────────────────────────────────────────────────
    price:          number;          // precio de venta unitario
    purchase_price: number;          // precio de compra al proveedor

    // ── Stock ──────────────────────────────────────────────────────────
    stock_current:   number;         // unidades físicas en depósito
    stock_available: number;         // unidades libres (sin reservas)
    reorder_point:   number;         // punto de reposición (antes min_stock)

    // ── Estado ─────────────────────────────────────────────────────────
    status:         ProductVariantStatus;

    // ── Fechas ─────────────────────────────────────────────────────────
    created_at:      string;
    updated_at:      string;
    expiration_date: string;         // opcional — vacío string si no aplica

    // ── Proveedores ────────────────────────────────────────────────────
    supplier_ids:    string[];       // refs a IDs del módulo Providers
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
export type GetProductVariantByStockPayload       = Pick<ProductVariantPayload, 'stock_current'>;
export type GetProductVariantByPricePayload       = Pick<ProductVariantPayload, 'price'>;
export type GetProductVariantByStatusPayload      = Pick<ProductVariantPayload, 'status'>;
export type GetProductVariantByNetContentPayload  = Pick<ProductVariantPayload, 'net_content'>;

export type CreateProductVariantPayload = Omit<ProductVariantPayload,
    '_id' | 'created_at' | 'updated_at' | 'status'
    // status se calcula al crear: si stock_current > 0 → 'available', si no → 'out_of_stock'
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
export type GetProductVariantByNetContentRequest = Request<ProductVariantParams, unknown, GetProductVariantByNetContentPayload>;
export type CreateProductVariantRequest         = Request<ProductVariantParams, unknown, CreateProductVariantPayload>;
export type DeleteProductVariantRequest         = Request<ProductVariantParams, unknown, GetProductVariantByIdPayload>;
export type EditProductVariantRequest           = Request<ProductVariantParams, unknown, EditProductVariantPayload>;

}