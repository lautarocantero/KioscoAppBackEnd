import { ProductVariant } from "../product-variant/productVariantTypes";

/*══════════════════════════════════════════════════════════════════════╗
║ 🧱 BASES 🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

// TO DO agregar el tipo public, comprobar que siga el estandar de auth

//base con todos los tipos
interface ProductDocument {
    _id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    image_url: string;
    gallery_urls: string[];
    brand: string;
    variants: ProductVariant[];
}

//base con las funciones de db-local
interface ProductModelInterface extends ProductDocument {
  find(query: Partial<ProductDocument>): Promise<ProductDocument[]>;
  findOne(query: Partial<ProductDocument>): Promise<ProductDocument | null>;
  save(query?: Partial<ProductDocument>, data?: Partial<ProductDocument>): Promise<void>;
  remove(query?: Partial<ProductDocument>): Promise<void>;
}

//base con tipos unknown para los payloads
type ProductUnknown = Record<keyof ProductDocument, unknown>;

/*══════════════════════════════════════════════════════════════════════╗
║ ✂️ DERIVADOS ✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️                ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type Product = ProductDocument;

export type ProductModelType = ProductModelInterface;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProductSchemaType = ProductDocument;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetProductByIdPayload = Pick<ProductUnknown, '_id' >;

export type GetProductByNamePayload = Pick<ProductUnknown, 'name' >;

export type GetProductByBrandPayload = Pick<ProductUnknown, 'brand' >;

export type CreateProductPayload = Omit<ProductUnknown, '_id' >;

export type DeleteProductPayload = Pick<ProductUnknown, '_id'>;

export type EditProductPayload = ProductUnknown;

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
export type GetProductByIdRequest = Request<ProductParams, unknown, GetProductByIdPayload>;

export type GetProductByNameRequest = Request<ProductParams, unknown, GetProductByNamePayload>;

export type GetProductByBrandRequest = Request<ProductParams, unknown, GetProductByBrandPayload>;

export type CreateProductRequest = Request<ProductParams, unknown, CreateProductPayload>;

export type DeleteProductRequest = Request<ProductParams, unknown, DeleteProductPayload>;

export type EditProductRequest = Request<ProductParams, unknown, EditProductPayload>;
