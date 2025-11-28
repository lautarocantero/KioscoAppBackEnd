import { ProductVariant } from "../product-variant/productVariantTypes";
/*══════════════════════════════════════════════════════════════════════╗
║ 🧱 BASES 🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

//base con todos los tipos
interface SellDocument {
    _id: string;
    products: ProductVariant[];
    purchase_date: string;
    seller_name: string;
    total_amount: number;
}

//base con las funciones de db-local
interface SellModelInterface extends SellDocument {
  find(query: Partial<SellDocument>): Promise<SellDocument[]>;
  findOne(query: Partial<SellDocument>): Promise<SellDocument | null>;
  save(query?: Partial<SellDocument>, data?: Partial<SellDocument>): Promise<void>;
  remove(query?: Partial<SellDocument>): Promise<void>;
}

//base con tipos unknown para los payloads
type SellUnknown = Record<keyof Omit<SellDocument, '_id'>, unknown>;

/*══════════════════════════════════════════════════════════════════════╗
║ ✂️ DERIVADOS ✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️                ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type Sell = SellDocument;

export type SellModelType = SellModelInterface;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type SellSchemaType = SellDocument;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetSellByIdPayload = Pick<SellDocument, '_id'>;

export type GetSellsBySellerPayload = Pick<SellDocument, 'seller_name'>;

export type GetSellsByDatePayload = Pick<SellDocument, 'purchase_date'>;

export type GetSellsByProductPayload = Pick<SellDocument, '_id'>;

export type CreateSellPayload = Omit<SellDocument, '_id'>;

export type DeleteSellPayload = Pick<SellDocument, '_id'>;

export type EditSellPayload = SellDocument;

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