import { Request } from 'express';

//──────────────────────────────────────────── 🔒 BASE PRINCIPAL 🔒 ───────────────────────────────────────────//

type NotificationType = 'low_stock' | 'sale';

interface LowStockNotificationPayload {
    presentationId: string;
    productName:    string;
    units:          number;
    minStock:       number;
}

interface SaleNotificationPayload {
    sellerId:   string;
    sellerName: string;
    amount:     number;
    currency:   string;
}

type NotificationPayload = LowStockNotificationPayload | SaleNotificationPayload;

interface NotificationEntity {
    _id:     string;
    type:    NotificationType;
    payload: NotificationPayload;
}

declare module '@typings/notification' {

    //──────────────────────────────────────────── 🧩 DERIVADOS 🧩 ───────────────────────────────────────────//

    export type NotificationType = NotificationType;

    export type LowStockNotificationPayload = LowStockNotificationPayload;

    export type SaleNotificationPayload = SaleNotificationPayload;

    export type NotificationPayload = NotificationPayload;

    // DTO que ve el cliente: readBy nunca se expone, se resuelve a `status` para el usuario actual.
    export type NotificationDTO = NotificationEntity & {
        status:    'not-read-yet' | 'readed';
        createdAt: Date;
    };

    //──────────────────────────────────────────── 🗂️ SCHEMA 🗂️ ───────────────────────────────────────────//

    export type NotificationSchemaType = NotificationEntity & {
        readBy:    string[];
        createdAt?: Date;
        updatedAt?: Date;
    };

    //──────────────────────────────────────────── 🔗 REQUEST 🔗 ───────────────────────────────────────────//

    export type MarkAsReadPayloadType = { _id: string };

    export type DeleteNotificationPayloadType = { _id: string };

    export type MarkAsReadRequestType = Request<Record<string, never>, unknown, MarkAsReadPayloadType>;

    export type DeleteNotificationRequestType = Request<Record<string, never>, unknown, DeleteNotificationPayloadType>;

}
