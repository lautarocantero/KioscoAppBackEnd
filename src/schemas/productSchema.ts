import DBLocal from "db-local";
import { ProductSchemaType } from "@typings/product";

const { Schema } = new DBLocal({ path: './db'});

/*──────────────────────────────
📦 ProductSchema (DB Local)
──────────────────────────────
📜 Propósito:
Definir el esquema de productos para la base de datos **local**.  
Este esquema se utiliza únicamente en casos de **falta de internet** como respaldo offline.  
Cuando haya conexión, las consultas se realizarán contra la base de datos **SQL** oficial.

🧩 Campos:
- _id           → Identificador único (String, requerido)
- name          → Nombre del producto (String, requerido)
- description   → Descripción del producto (String, requerido)
- created_at    → Fecha de creación (String, requerido)
- updated_at    → Fecha de última actualización (String, requerido)
- image_url     → URL de imagen principal (String, requerido)
- gallery_urls  → Array de URLs de imágenes adicionales (Array, requerido)
- brand         → Marca del producto (String, requerido)
- variants      → Variantes asociadas al producto (Array, requerido)

🛡️ Notas:
- Este esquema NO reemplaza la base de datos SQL, solo actúa como fallback local.
- Los datos almacenados aquí son temporales y se sincronizan con SQL cuando hay conexión.
──────────────────────────────*/

export const ProductSchema = Schema<ProductSchemaType>('Product', {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true }, 
    created_at: { type: String, required: true }, 
    updated_at: { type: String, required: true },
    image_url: { type: String, required: true }, 
    gallery_urls: { type: Array, required: true }, 
    brand: { type: String, required: true }, 
    variants: { type: Array, required: true }, 
});
