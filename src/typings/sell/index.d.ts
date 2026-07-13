/*───────────────────────────────────────────────
 📄 Nota:
 La documentación completa de las entidades 
 de ventas está en `src/typings/sell/sellDocs.md`.
 Este archivo contiene únicamente los tipos.
───────────────────────────────────────────────*/

import { presentation } from "@typings/presentation";
import { Request } from "express";

//──────────────────────────────────────────── 🔒 BASE PRINCIPAL 🔒 ───────────────────────────────────────────//

interface SellEntityInterface {
    _id: string; 
    currency: string;
    iva: number; 
    modification_date: string; 
    payment_method: string; 
    products: presentation[]; 
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

  //──────────────────────────────────────────── 🔗 ANALYTICS 🔗 ───────────────────────────────────────────//

export type PresentationAnalyticsQuery = {
    start_date?: string; // 'YYYY-MM-DD'
    end_date?: string;   // 'YYYY-MM-DD'
    seller_id?: string;
};

export type GetPresentationAnalyticsRequest = Request<
    { presentation_id: string },
    unknown,
    unknown,
    PresentationAnalyticsQuery
>;

export interface DailySalePoint {
    isoDate: string;
    date: string;   // '01 may'
    units: number;
    revenue: number;
}

export interface WeeklySalePoint {
    weekLabel: string; // '29 abr - 05 may'
    units: number;
    revenue: number;
}

export interface PresentationAnalyticsRaw {
    presentation_id: string;
    range: { start: string; end: string };
    comparisonRange: { start: string; end: string };
    totals: { units: number; revenue: number; activeDays: number; avgTicket: number };
    previousTotals: { units: number; revenue: number; activeDays: number; avgTicket: number };
    deltas: {
        unitsPct: number | null;
        revenuePct: number | null;
        activeDaysPct: number | null;
        avgTicketPct: number | null;
    };
    dailySales: DailySalePoint[];
    weeklySales: WeeklySalePoint[];
    topSellingDays: DailySalePoint[];
    periodSummary: {
        maxDaily: DailySalePoint | null;
        minDaily: DailySalePoint | null;
        avgDailyUnits: number;
        activeDaysCount: number;
    };
}