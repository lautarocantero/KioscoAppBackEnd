import DBLocal from "db-local";
import { PresentationSchemaType } from "@typings/presentation";

const { Schema } = new DBLocal({ path: './db'});

/*──────────────────────────────
🎭 PresentationSchema (DB Local)
──────────────────────────────
📜 Propósito:
Definir el esquema de presentationes para la base de datos **local**.
Este esquema se utiliza únicamente en casos de **falta de internet** como respaldo offline.
Cuando haya conexión, las consultas se realizarán contra la base de datos **SQL** oficial.

🧩 Campos:
- _id             → Identificador único (String, requerido)
- product_id      → ID del producto padre (String, requerido)
- sku             → Código SKU de la presentación (String, requerido)
- name            → Nombre de la presentación (String, requerido)
- description     → Descripción opcional (String, requerido)
- brand           → Marca de la presentación (String, requerido)
- model_type      → Tipo de modelo/presentación (String, requerido)
- model_size      → Tamaño / contenido neto (String, requerido)
- image_url       → URL de imagen principal (String, requerido)
- price           → Precio de venta unitario (Number, requerido)
- stock           → Unidades disponibles (Number, requerido)
- min_stock       → Punto mínimo de reposición (Number, requerido)
- status          → available | out_of_stock | unavailable (String, requerido)
- created_at      → Fecha de creación (String, requerido)
- updated_at      → Fecha de última actualización (String, requerido)
- expiration_date → Fecha de vencimiento opcional (String, requerido)

🛡️ Notas:
- Este esquema NO reemplaza la base de datos SQL, solo actúa como fallback local.
- Los datos almacenados aquí son temporales y se sincronizan con SQL cuando hay conexión.
──────────────────────────────*/

export const PresentationSchema = Schema<PresentationSchemaType>('Presentation', {
    _id:             { type: String,   required: true },
    product_id:      { type: String,   required: true },
    sku:             { type: String,   required: true },
    name:            { type: String,   required: true },
    description:     { type: String,   required: true },
    brand:           { type: String,   required: true },
    model_type:      { type: String,   required: true },
    model_size:      { type: String,   required: true },
    image_url:       { type: String,   required: true },
    price:           { type: Number,   required: true },
    stock:           { type: Number,   required: true },
    min_stock:       { type: Number,   required: true },
    status:          { type: String,   required: true },
    created_at:      { type: String,   required: true },
    updated_at:      { type: String,   required: true },
    expiration_date: { type: String,   required: true },
});