/*───────────────────────────────────────────────
 📄 Nota:
 La documentación completa de las entidades 
 de ventas está en `src/typings/sell/sellDocs.md`.
 Este archivo contiene únicamente los tipos.
───────────────────────────────────────────────*/

import { presentation } from "@typings/presentation";
import { ProductTicketType } from "@typings/product";
import { Request } from "express";

//──────────────────────────────────────────── 🔒 BASE PRINCIPAL 🔒 ───────────────────────────────────────────//

interface SellEntityInterface {
    _id: string;
    kiosco_id: string;
    currency: string;
    iva: number; 
    modification_date: string; 
    payment_method: string; 
    products: ProductTicketType[];
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

  export type SellSchemaType = SellType & {
    createdAt?: Date;
    updatedAt?: Date;
    status: SellStatusEnum;
    amount_paid: number | null;
    debtor_name: string | null;
    // Vínculo entre una venta parcial y la venta de saldo que la saldó.
    settles_sell_id: string | null;
    settled_by_sell_id: string | null;
  };

  //──────────────────────────────────────────── 📦 PAYLOAD 📦 ───────────────────────────────────────────//

  export type GetSellByIdPayloadType = Pick<SellPayloadType, '_id'>;

  export type GetSellsBySellerPayloadType = Pick<SellPayloadType, 'seller_name'>;

  export type GetSellsByDatePayloadType = Pick<SellPayloadType, 'purchase_date'>;

  export type GetSellsByProductPayloadType = Pick<SellPayloadType, '_id'>;

  // 🔧 FIX: se excluye 'products' del Omit (quedaba en `unknown`) y se redefine como presentation[]
  // kiosco_id nunca viene del cliente: se resuelve del header x-kiosco-id (ver requireKioscoContext)
  export type CreateSellPayloadType = Omit<SellPayloadType, '_id' | 'kiosco_id' | 'modification_date' | 'products'> & {
    products: ProductTicketType[];
    status: SellStatusEnum;
    amount_paid: number | null;
    debtor_name: string | null;
    // Cuando es true, no se descuenta ni valida stock para esta venta —
    // usado por la venta de saldo que genera "saldar deuda" en el frontend.
    skip_stock?: boolean;
    // _id de la venta parcial que esta venta salda, cuando esta venta ES una
    // venta de saldo generada por "saldar deuda".
    settles_sell_id?: string | null;
  };

  export type DeleteSellPayloadType = Pick<SellPayloadType, '_id'>;

  // status/amount_paid/debtor_name/settled_by_sell_id son opcionales: solo se
  // envían al saldar una deuda (parcial → completada). El resto de las
  // ediciones de venta (formulario completo) no los manda y edit() no los toca.
  export type EditSellPayloadType = Omit<SellPayloadType, 'kiosco_id'> & {
    status?: SellStatusEnum;
    amount_paid?: number | null;
    debtor_name?: string | null;
    // _id de la venta de saldo que saldó esta venta, cuando esta venta ES la
    // venta original que pasó de parcial a completada.
    settled_by_sell_id?: string | null;
  };

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

  //──────────────────────────────────────────── 📊 REPORTS 📊 ───────────────────────────────────────────//

  // Reporte básico del mes en curso — para el plan Standard es el único
  // reporte disponible (ver PlanService.getSellsDateFloor); para Deluxe es
  // un resumen rápido además del historial completo sin restricción.
  export type MonthlySalesReportType = {
    month: string;
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
  };

}

  //──────────────────────────────────────────── 🔗 ANALYTICS 🔗 ───────────────────────────────────────────//

export type PresentationAnalyticsQuery = {
    start_date?: string;
    end_date?: string;
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
    date: string;
    units: number;
    revenue: number;
}

export interface WeeklySalePoint {
    weekLabel: string;
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