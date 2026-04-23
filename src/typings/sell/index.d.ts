/*───────────────────────────────────────────────
 📄 Nota:
 La documentación completa de las entidades 
 de ventas está en `src/typings/sell/sellDocs.md`.
 Este archivo contiene únicamente los tipos.
───────────────────────────────────────────────*/

import { ProductVariant } from "@typings/productVariant";

//──────────────────────────────────────────── 🔒 BASE PRINCIPAL 🔒 ───────────────────────────────────────────//

interface SellEntityInterface {
    _id: string; 
    currency: string;
    iva: number; 
    modification_date: string; 
    payment_method: string; 
    products: ProductVariant[]; 
    purchase_date: string; 
    seller_id: string; 
    seller_name: string;
    sub_total: number; 
    total_amount: number;
}

//──────────────────────────────────────────── 🌐 BASE API 🌐 ───────────────────────────────────────────//

interface SellRepositoryInterface extends SellEntityInterface {
  find(query: Partial<SellEntityInterface> | ((item: SellEntityInterface, index: number) => boolean)): Promise<SellEntityInterface[]>;
  findOne(query: Partial<SellEntityInterface>): Promise<SellEntityInterface | null>;
  save(query?: Partial<SellEntityInterface>, data?: Partial<SellEntityInterface>): Promise<void>;
  remove(query?: Partial<SellEntityInterface>): Promise<void>;
}

type SellRawPayloadType = Record<keyof SellEntityInterface, unknown>;

declare module '@typings/sell' {

  //──────────────────────────────────────────── 🧩 DERIVADOS 🧩 ───────────────────────────────────────────//

  export type SellType = SellEntityInterface;

  export type SellPublicType = Omit<SellEntityInterface ,'iva' | 'modification_date' | 'seller_id' | '_id'>;

  export type SellModelType = SellRepositoryInterface;

  export type SellPayloadType = SellRawPayloadType;

  //──────────────────────────────────────────── 🗂️ SCHEMA 🗂️ ───────────────────────────────────────────//

  export type SellSchemaType = SellType;

  //──────────────────────────────────────────── 📦 PAYLOAD 📦 ───────────────────────────────────────────//

  export type GetSellByIdPayloadType = Pick<SellPayloadType, '_id'>;

  export type GetSellsBySellerPayloadType = Pick<SellPayloadType, 'seller_name'>;

  export type GetSellsByDatePayloadType = Pick<SellPayloadType, 'purchase_date'>;

  export type GetSellsByProductPayloadType = Pick<SellPayloadType, '_id'>;

  export type CreateSellPayloadType = Omit<SellPayloadType, '_id' | 'modification_date'>;

  export type DeleteSellPayloadType = Pick<SellPayloadType, '_id'>;

  export type EditSellPayloadType = SellPayloadType;

  //──────────────────────────────────────────── 🔗 REQUEST 🔗 ───────────────────────────────────────────//
  
  type SellParamsType = {
    _id?: string;
  };

  export type GetSellByIdRequestType = Request<SellParamsType, unknown, GetSellByIdPayloadType>;

  export type GetSellsBySellerRequestType = Request<Record<string, never>, unknown, GetSellsBySellerPayloadType>;

  export type GetSellsByDateRequestType = Request<Record<string, never>, unknown, GetSellsByDatePayloadType>;

  export type GetSellsByProductRequestType = Request<Record<string, never>, unknown, GetSellsByProductPayloadType>;

  export type CreateSellRequestType = Request<Record<string, never>, unknown, CreateSellPayloadType>;

  export type DeleteSellRequestType = Request<SellParamsType, unknown, DeleteSellPayloadType>;

  export type EditSellRequestType = Request<Record<string, never>, unknown, EditSellPayloadType>;

}
