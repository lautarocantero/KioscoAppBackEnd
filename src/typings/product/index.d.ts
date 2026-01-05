
/*──────────────────────────────
📘 ProductTypes
──────────────────────────────
📜 Propósito:
Definir tipados base y derivados para productos.  
Incluye entidad principal, repositorio local (db-local), payloads y requests.

🧩 Derivaciones:
- ProductEntity → Product → ProductSchemaType
- ProductEntity → ProductRepository → ProductModelType
- ProductEntity → ProductPayloadUnknown → ProductPayload
- ProductPayload → Payloads específicos (Get, Create, Delete, Edit)
- Payloads → Requests tipados para controladores

🛡️ Seguridad:
- Usar ProductPublic para exponer datos sin campos sensibles.
- Validar siempre los payloads antes de persistir o responder.
──────────────────────────────*/

import { ProductVariant } from "../product-variant/productVariantTypes";

/*══════════════════════════════════════════════════════════════════════╗
║ 🔒 BASES PRIVADAS 🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒           ║
╚══════════════════════════════════════════════════════════════════════╝*/
declare module '@typings/product' {

//base 
interface ProductEntity {
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
interface ProductRepository extends ProductEntity {
  find(query: Partial<ProductEntity>): Promise<ProductEntity[]>;
  findOne(query: Partial<ProductEntity>): Promise<ProductEntity | null>;
  save(query?: Partial<ProductEntity>, data?: Partial<ProductEntity>): Promise<void>;
  remove(query?: Partial<ProductEntity>): Promise<void>;
}

//base para payloads, no se de que dato seran, necesito validarlos.
type ProductPayloadUnknown = Record<keyof ProductEntity, unknown>;

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS PUBLICOS 🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩      ║
╚══════════════════════════════════════════════════════════════════════╝*/

// derivado para no utilizar directamente el ProductEntity
export type Product = ProductEntity;

// derivado para los datos publicos
export type ProductPublic = Omit<ProductEntity, ''>

//derivado para acceder a los metodos de Product
export type ProductModelType = ProductRepository;

//derivado para data de payloads y posterior validacion
export type ProductPayload = ProductPayloadUnknown;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProductSchemaType = Product;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetProductByIdPayload = Pick<ProductPayload, '_id' >;

export type GetProductByNamePayload = Pick<ProductPayload, 'name' >;

export type GetProductByBrandPayload = Pick<ProductPayload, 'brand' >;

export type CreateProductPayload = Omit<ProductPayload, '_id' >;

export type DeleteProductPayload = Pick<ProductPayload, '_id'>;

export type EditProductPayload = ProductPayload;

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
export type GetProductByIdRequest = Request<ProductParams, unknown, GetProductByIdPayload>;

export type GetProductByNameRequest = Request<ProductParams, unknown, GetProductByNamePayload>;

export type GetProductByBrandRequest = Request<ProductParams, unknown, GetProductByBrandPayload>;

export type CreateProductRequest = Request<ProductParams, unknown, CreateProductPayload>;

export type DeleteProductRequest = Request<ProductParams, unknown, DeleteProductPayload>;

export type EditProductRequest = Request<ProductParams, unknown, EditProductPayload>;

}