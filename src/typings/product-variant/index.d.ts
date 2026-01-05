
/*──────────────────────────────
📘 ProductVariantTypes
──────────────────────────────
📜 Propósito:
Definir tipados base y derivados para variantes de producto.  
Incluye entidad principal, repositorio local (db-local), payloads y requests.

🧩 Derivaciones:
- ProductVariantEntity → ProductVariant → ProductVariantSchemaType
- ProductVariantEntity → ProductVariantRepository → ProductVariantModelType
- ProductVariantEntity → ProductVariantPayloadUnknown → ProductVariantPayload
- ProductVariantPayload → Payloads específicos (Get, Create, Edit, Delete)
- Payloads → Requests tipados para controladores

🛡️ Seguridad:
- Usar ProductVariantPublic para exponer datos sin campos sensibles.
- Validar siempre los payloads antes de persistir o responder.

🌀 Flujo estándar:
[Request] → [Payload] → [Repository] → [DB Local/SQL] → [Response]
──────────────────────────────*/

declare module '@typings/productVariant' {

/*══════════════════════════════════════════════════════════════════════╗
║ 🔒 BASES PRIVADAS 🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒           ║
╚══════════════════════════════════════════════════════════════════════╝*/
//base
interface ProductVariantEntity {
    _id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    image_url: string;
    gallery_urls: string[];
    brand: string;
    product_id: string;
    sku: string;
    model_type: string;
    model_size: string;
    min_stock: number;
    stock: number;
    price: number;
    expiration_date: string;
}

//base con las funciones de db-local
interface ProductVariantRepository extends ProductVariantEntity {
  find(query: Partial<ProductVariantEntity>): Promise<ProductVariantEntity[]>;
  findOne(query: Partial<ProductVariantEntity>): Promise<ProductVariantEntity | null>;
  save(query?: Partial<ProductVariantEntity>, data?: Partial<ProductVariantEntity>): Promise<void>;
  remove(query?: Partial<ProductVariantEntity>): Promise<void>;
}

//base para payloads
type ProductVariantPayloadUnknown = Record<keyof ProductVariantEntity, unknown>;

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS 🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩                ║
╚══════════════════════════════════════════════════════════════════════╝*/

// derivado para no utilizar directamente el ProductVariantEntity
export type ProductVariant = ProductVariantEntity;

// derivado para los datos publicos
export type ProductVariantPublic = Omit<ProductVariantEntity, ''>;

// derivado para acceder a los metodos de ProductVariant
export type ProductVariantModelType = ProductVariantRepository;

// derivado para data de payloads y posterior validacion
export type ProductVariantPayload = ProductVariantPayloadUnknown;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProductVariantSchemaType = ProductVariant;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
// recordar que deben ser unknown todos los campos
export type GetProductVariantByIdPayload = Pick<ProductVariantPayload, '_id' >;

export type GetProductVariantByProductIdPayload = Pick<ProductVariantPayload, 'product_id' >;

export type GetProductVariantByBrandPayload = Pick<ProductVariantPayload, 'brand' >;

export type GetProductVariantByStockPayload = Pick<ProductVariantPayload, 'stock' >;

export type GetProductVariantByPricePayload = Pick<ProductVariantPayload, 'price' >;

export type GetProductVariantBySizePayload = Pick<ProductVariantPayload, 'model_size' >;

export type GetProductVariantByPresentationPayload = Pick<ProductVariantPayload, 'model_type' >;

export type CreateProductVariantPayload = Omit<ProductVariantPayload, '_id' | 'created_at' | 'updated_at' >;

export type EditProductVariantPayload = ProductVariantPayload;

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetProductVariantByIdRequest = Request<ProductParams, unknown, GetProductVariantByIdPayload>;

export type GetProductVariantByProductIdRequest = Request<ProductParams, unknown, GetProductVariantByProductIdPayload>;

export type GetProductVariantByBrandRequest = Request<ProductParams, unknown, GetProductVariantByBrandPayload>;

export type GetProductVariantByStockRequest = Request<ProductParams, unknown, GetProductVariantByStockPayload>;

export type GetProductVariantByPriceRequest = Request<ProductParams, unknown, GetProductVariantByPricePayload>;

export type GetProductVariantBySizeRequest = Request<ProductParams, unknown, GetProductVariantBySizePayload>;

export type GetProductVariantByPresentationRequest = Request<ProductParams, unknown, GetProductVariantByPresentationPayload>;

export type CreateProductVariantRequest = Request<ProductVariantParams, unknown, CreateProductVariantPayload>;

export type CreateProductVariantRequest = Request<ProductVariantParams, unknown, CreateProductVariantPayload>;

export type DeleteProductVariantRequest = Request<ProductVariantParams, unknown, GetProductVariantByIdPayload>;

export type EditProductVariantRequest = Request<ProductVariantParams, unknown, EditProductVariantPayload>;

}