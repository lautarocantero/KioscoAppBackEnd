import DBLocal from "db-local";
import { SellSchemaType } from "@typings/sell";

const { Schema } = new DBLocal({ path: './db'});

/*──────────────────────────────
💰 SellSchema (DB Local)
──────────────────────────────
📜 Propósito:
Definir el esquema de ventas para la base de datos **local**.  
Este esquema se utiliza únicamente en casos de **falta de internet** como respaldo offline.  
Cuando haya conexión, las consultas se realizarán contra la base de datos **SQL** oficial.

🧩 Campos:
- _id           → Identificador único de la venta (String, requerido)
- products      → Array de productos vendidos (Array, requerido)
- purchase_date → Fecha de la compra (String, requerido)
- seller_name   → Nombre del vendedor responsable (String, requerido)
- total_amount  → Monto total de la venta (Number, requerido)

🛡️ Notas:
- Este esquema NO reemplaza la base de datos SQL, solo actúa como fallback local.
- Los datos almacenados aquí son temporales y se sincronizan con SQL cuando hay conexión.
──────────────────────────────*/

export const SellSchema = Schema<SellSchemaType>('Sell', {
    _id: { type: String, required: true },
    products: { type: Array, required: true },
    purchase_date: { type: String, required: true },
    seller_name: { type: String, required: true },
    total_amount: { type: Number, required: true },
});
