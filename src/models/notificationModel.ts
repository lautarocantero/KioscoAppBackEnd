import {
  LowStockNotificationPayload,
  NotificationDTO,
  NotificationSchemaType,
  SaleNotificationPayload,
} from '@typings/notification';
import { Validation } from './validation';
import { NotificationSchema } from '../schemas/notificationSchema';

/*──────────────────────────────
🔔 NotificationModel — Mongoose
──────────────────────────────
📜 Propósito: Notificaciones compartidas entre todos los usuarios (venta
registrada, stock bajo). El estado de lectura es por usuario: se guarda
como `readBy` (array de user ids) y nunca se expone tal cual al cliente,
se resuelve a `status` ('readed' | 'not-read-yet') para el usuario que
hizo el pedido.
🧩 Dependencias: NotificationSchema, Validation
──────────────────────────────*/

export class NotificationModel {

  //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

  static async getAll(userId: string): Promise<NotificationDTO[]> {
    const results = await NotificationSchema.find().sort({ createdAt: -1 }).lean();

    return (results as unknown as NotificationSchemaType[]).map(({ readBy, ...rest }) => ({
      ...rest,
      status: readBy.includes(userId) ? 'readed' : 'not-read-yet',
    })) as NotificationDTO[];
  }

  //──────────────────────────────────────────── 📤 CREATE 📤 ───────────────────────────────────────────//

  static async createSaleNotification(data: SaleNotificationPayload): Promise<void> {
    const { sellId, sellerId, sellerName, amount, currency } = data;

    const sellIdResult     = Validation.stringValidation(sellId, 'sell_id');
    const sellerIdResult   = Validation.stringValidation(sellerId, 'seller_id');
    const sellerNameResult = Validation.stringValidation(sellerName, 'seller_name');
    const amountResult     = Validation.number(amount, 'amount');
    const currencyResult   = Validation.stringValidation(currency, 'currency');

    await NotificationSchema.create({
      _id: crypto.randomUUID(),
      type: 'sale',
      payload: {
        sellId: sellIdResult,
        sellerId: sellerIdResult,
        sellerName: sellerNameResult,
        amount: amountResult,
        currency: currencyResult,
      },
      readBy: [],
    });
  }

  static async createLowStockNotification(data: LowStockNotificationPayload): Promise<void> {
    const { presentationId, productId, productName, units, minStock } = data;

    const presentationIdResult = Validation.stringValidation(presentationId, 'presentation_id');
    const productIdResult      = Validation.stringValidation(productId, 'product_id');
    // length 1 (no el default de 3): a diferencia de un nombre de usuario o
    // sku, un nombre de producto real puede ser legítimamente corto ("Pan").
    const productNameResult    = Validation.stringValidation(productName, 'product_name', 1);
    const unitsResult          = Validation.number(units, 'units', true);
    const minStockResult       = Validation.number(minStock, 'min_stock', true);

    await NotificationSchema.create({
      _id: crypto.randomUUID(),
      type: 'low_stock',
      payload: {
        presentationId: presentationIdResult,
        productId: productIdResult,
        productName: productNameResult,
        units: unitsResult,
        minStock: minStockResult,
      },
      readBy: [],
    });
  }

  //──────────────────────────────────────────── 🛠️ PATCH 🛠️ ───────────────────────────────────────────//

  static async markAsRead(_id: string, userId: string): Promise<void> {
    const idResult = Validation.stringValidation(_id, '_id');

    const updated = await NotificationSchema.findOneAndUpdate(
      { _id: idResult },
      { $addToSet: { readBy: userId } },
    );

    if (!updated) throw new Error(`There is not any notification with that id ${_id}`);
  }

  static async markAsUnread(_id: string, userId: string): Promise<void> {
    const idResult = Validation.stringValidation(_id, '_id');

    const updated = await NotificationSchema.findOneAndUpdate(
      { _id: idResult },
      { $pull: { readBy: userId } },
    );

    if (!updated) throw new Error(`There is not any notification with that id ${_id}`);
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await NotificationSchema.updateMany(
      { readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );
  }

  //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

  static async deleteOne(_id: string): Promise<void> {
    const idResult = Validation.stringValidation(_id, '_id');

    const deleted = await NotificationSchema.findOneAndDelete({ _id: idResult });
    if (!deleted) throw new Error(`There is not any notification with that id ${_id}`);
  }

  static async deleteAll(): Promise<void> {
    await NotificationSchema.deleteMany({});
  }
}
