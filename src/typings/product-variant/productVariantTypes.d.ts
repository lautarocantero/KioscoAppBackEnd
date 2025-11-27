

/*══════════════════════════════════════════════════════════════════════╗
║ 🧱 BASES 🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
//base con todos los tipos
interface ProductVariantDocument {
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
interface ProductVariantModelInterface extends ProductVariantDocument {
  find(query: Partial<ProductVariantDocument>): Promise<ProductVariantDocument[]>;
  findOne(query: Partial<ProductVariantDocument>): Promise<ProductVariantDocument | null>;
  save(query?: Partial<ProductVariantDocument>, data?: Partial<ProductVariantDocument>): Promise<void>;
  delete(query: Partial<ProductVariantDocument>): Promise<void>;
}

//base con tipos unknown para los payloads
type ProductVariantUnknown = Record<keyof Omit<ProductVariantDocument, '_id'>, unknown>;

/*══════════════════════════════════════════════════════════════════════╗
║ ✂️ DERIVADOS ✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️                ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProductVariant = ProductVariantDocument;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProductVariantSchemaType = ProductVariantDocument;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
// recordar que deben ser unknown todos los campos
export type GetProductVariantByIdPayload = Pick<ProductUnknown, '_id' >;

export type GetProductVariantByProductIdPayload = Pick<ProductUnknown, 'product_id' >;

export type CreateProductVariantPayload = Omit<ProductVariantUnknown, '_id'>;

export type EditProductVariantPayload = ProductUnknown;

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetProductVariantByIdRequest = Request<ProductParams, unknown, GetProductVariantByIdPayload>;

export type GetProductVariantByProductIdRequest = Request<ProductParams, unknown, GetProductVariantByProductIdPayload>;

export type CreateProductVariantRequest = Request<ProductVariantParams, unknown, CreateProductVariantPayload>;

export type CreateProductVariantRequest = Request<ProductVariantParams, unknown, CreateProductVariantPayload>;

export type DeleteProductVariantRequest = Request<ProductVariantParams, unknown, GetProductVariantByIdPayload>;

export type EditProductVariantRequest = Request<ProductVariantParams, unknown, EditProductVariantPayload>;
