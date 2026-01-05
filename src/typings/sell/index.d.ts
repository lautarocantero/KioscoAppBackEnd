
/*──────────────────────────────
📘 SellTypes
──────────────────────────────
📜 Propósito:
Definir tipados base y derivados para ventas.  
Incluye entidad principal, repositorio local (db-local), payloads y requests.

🧩 Derivaciones:
- SellEntity → Sell → SellSchemaType
- SellEntity → SellRepository → SellModelType
- SellEntity → SellPayloadUnknown → SellPayload
- SellPayload → Payloads específicos (Get, Create, Edit, Delete)
- Payloads → Requests tipados para controladores

🛡️ Seguridad:
- Usar SellPublic para exponer datos sin campos sensibles.
- Validar siempre los payloads antes de persistir o responder.

🌀 Flujo estándar:
[Request] → [Payload] → [Repository] → [DB Local/SQL] → [Response]
──────────────────────────────*/


import { ProductVariant } from "../product-variant/productVariantTypes";

declare module '@typings/sell' {
/*══════════════════════════════════════════════════════════════════════╗
║ 🔒 BASE PRINCIPAL 🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

//base
interface SellEntity {
    _id: string;
    products: ProductVariant[];
    purchase_date: string;
    seller_name: string;
    total_amount: number;
}

//base con las funciones de db-local
interface SellRepository extends SellEntity {
  find(query: Partial<SellEntity>): Promise<SellEntity[]>;
  findOne(query: Partial<SellEntity>): Promise<SellEntity | null>;
  save(query?: Partial<SellEntity>, data?: Partial<SellEntity>): Promise<void>;
  remove(query?: Partial<SellEntity>): Promise<void>;
}

//base para payloads
type SellPayloadUnknown = Record<keyof SellEntity, unknown>;

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS 🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩                ║
╚══════════════════════════════════════════════════════════════════════╝*/

// derivado para no utilizar directamente el SellEntity
export type Sell = SellEntity;

// derivado para los datos publicos
export type SellPublic = Omit<SellEntity ,''>;

//derivado para acceder a los metodos de Sell 
export type SellModelType = SellRepository;

//derivado para data de payloads y posterior validacion
export type SellPayload = SellPayloadUnknown;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type SellSchemaType = Sell;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetSellByIdPayload = Pick<SellPayload, '_id'>;

export type GetSellsBySellerPayload = Pick<SellPayload, 'seller_name'>;

export type GetSellsByDatePayload = Pick<SellPayload, 'purchase_date'>;

export type GetSellsByProductPayload = Pick<SellPayload, '_id'>;

export type CreateSellPayload = Omit<SellPayload, '_id'>;

export type DeleteSellPayload = Pick<SellPayload, '_id'>;

export type EditSellPayload = SellPayload;

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetSellByIdRequest = Request<SellParams, unknown, GetSellByIdPayload>;

export type GetSellsBySellerRequest = Request<SellParams, unknown, GetSellsBySellerPayload>;

export type GetSellsByDateRequest = Request<SellParams, unknown, GetSellsByDatePayload>;

export type GetSellsByProductRequest = Request<SellParams, unknown, GetSellsByProductPayload>;

export type CreateSellRequest = Request<SellParams, unknown, CreateSellPayload>;

export type DeleteSellRequest = Request<SellParams, unknown, DeleteSellPayload>;

export type EditSellRequest = Request<SellParams, unknown, EditSellPayload>;

}