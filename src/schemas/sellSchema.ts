
/*──────────────────────────────
💰 SellSchema (DB Local)
──────────────────────────────
📜 Propósito:
Definir el esquema de ventas para la base de datos **local**.  
Este esquema se utiliza únicamente en casos de **falta de internet** como respaldo offline.  
Cuando haya conexión, las consultas se realizarán contra la base de datos **SQL** oficial.

🧩 Campos:
- currency         → Moneda utilizada en la transacción (String, requerido)
- iva              → Impuesto aplicado a la venta (Number, requerido)
- modification_date→ Fecha de edición de la venta (String, opcional)
- payment_method   → Método de pago elegido (String, requerido)
- products         → Array de productos vendidos (Array, requerido)
- purchase_date    → Fecha de la compra (String, requerido)
- seller_id        → Identificador del vendedor responsable (String, requerido)
- seller_name      → Nombre del vendedor responsable (String, requerido)
- sub_total        → Subtotal de la venta antes de impuestos (Number, requerido)
- ticket_id        → Identificador único de la venta (String, requerido)
- total_amount     → Monto total de la venta (Number, requerido)

🛡️ Notas:
- Este esquema NO reemplaza la base de datos SQL, solo actúa como fallback local.  
- Los datos almacenados aquí son temporales y se sincronizan con SQL cuando hay conexión.  
- Permite mantener la operatividad del sistema en modo offline y asegurar consistencia al reconectar.  
──────────────────────────────*/

import mongoose, { Schema } from 'mongoose';
import { SellSchemaType } from '@typings/sell';

const ProductVariantSubSchema = new Schema({}, { strict: false, _id: false });

const SellMongoSchema = new Schema<SellSchemaType>({
    ticket_id:         { type: String, required: true },
    currency:          { type: String, required: true },
    iva:               { type: Number, required: true },
    modification_date: { type: String, required: false },
    payment_method:    { type: String, required: true },
    products:          { type: [ProductVariantSubSchema], required: true },
    purchase_date:     { type: String, required: true },
    seller_id:         { type: String, required: true },
    seller_name:       { type: String, required: true },
    sub_total:         { type: Number, required: true },
    total_amount:      { type: Number, required: true },
}, { _id: false });

export const SellSchema = mongoose.models.Sell ||
    mongoose.model<SellSchemaType>('Sell', SellMongoSchema, 'sells');
