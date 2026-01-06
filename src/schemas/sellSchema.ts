
/*──────────────────────────────
💰 SellSchema (DB Local)
──────────────────────────────
📜 Propósito:
Definir el esquema de ventas para la base de datos **local**.  
Este esquema se utiliza únicamente en casos de **falta de internet** como respaldo offline.  
Cuando haya conexión, las consultas se realizarán contra la base de datos **SQL** oficial.

🧩 Campos:
- ticket_id        → Identificador único de la venta (String, requerido)
- purchase_date    → Fecha de la compra (String, requerido)
- modification_date→ Fecha de edición de la venta (String, opcional)
- seller_id        → Identificador del vendedor responsable (String, requerido)
- seller_name      → Nombre del vendedor responsable (String, requerido)
- payment_method   → Método de pago elegido (String, requerido)
- products         → Array de productos vendidos (Array, requerido)
- sub_total        → Subtotal de la venta antes de impuestos (Number, requerido)
- iva              → Impuesto aplicado a la venta (Number, requerido)
- total_amount     → Monto total de la venta (Number, requerido)
- currency         → Moneda utilizada en la transacción (String, requerido)

🛡️ Notas:
- Este esquema NO reemplaza la base de datos SQL, solo actúa como fallback local.  
- Los datos almacenados aquí son temporales y se sincronizan con SQL cuando hay conexión.  
- Permite mantener la operatividad del sistema en modo offline y asegurar consistencia al reconectar.  
──────────────────────────────*/


import DBLocal from "db-local";
import { SellSchemaType } from "@typings/sell";

const { Schema } = new DBLocal({ path: './db'});

export const SellSchema = Schema<SellSchemaType>('Sell', {
    ticket_id: { type: String, required: true },
    purchase_date: { type: String, required: true },
    modification_date: { type: String, required: false },
    seller_id: { type: String, required: true },
    seller_name: { type: String, required: true },
    payment_method: { type: String, required: true },
    products: { type: Array, required: true },
    sub_total: { type: Number, required: true },
    iva: { type: Number, required: true },
    total_amount: { type: Number, required: true },
    currency: { type: String, required: true},
});
