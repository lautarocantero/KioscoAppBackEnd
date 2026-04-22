
/*──────────────────────────────
🎭 ProductVariantSchema (DB Local)
──────────────────────────────
📜 Propósito:
Definir el esquema de variantes de producto para la base de datos **local**.  
Este esquema se utiliza únicamente en casos de **falta de internet** como respaldo offline.  
Cuando haya conexión, las consultas se realizarán contra la base de datos **SQL** oficial.

🧩 Campos:
- _id             → Identificador único (String, requerido)
- name            → Nombre de la variante (String, requerido)
- description     → Descripción de la variante (String, requerido)
- created_at      → Fecha de creación (String, requerido)
- updated_at      → Fecha de última actualización (String, requerido)
- image_url       → URL de imagen principal (String, requerido)
- gallery_urls    → Array de URLs de imágenes adicionales (Array, requerido)
- brand           → Marca asociada (String, requerido)
- product_id      → ID del producto padre (String, requerido)
- sku             → Código SKU de la variante (String, requerido)
- model_type      → Tipo de modelo (String, requerido)
- model_size      → Tamaño del modelo (String, requerido)
- min_stock       → Stock mínimo permitido (Number, requerido)
- stock           → Stock actual disponible (Number, requerido)
- price           → Precio de la variante (Number, requerido)
- expiration_date → Fecha de vencimiento (String, requerido)

🛡️ Notas:
- Este esquema NO reemplaza la base de datos SQL, solo actúa como fallback local.
- Los datos almacenados aquí son temporales y se sincronizan con SQL cuando hay conexión.
──────────────────────────────*/

import mongoose, { Schema } from 'mongoose';
import { ProductVariantSchemaType } from '@typings/productVariant';

const ProductVariantMongoSchema = new Schema<ProductVariantSchemaType>({
    _id:             { type: String, required: true },
    name:            { type: String, required: true },
    description:     { type: String, required: true },
    created_at:      { type: String, required: true },
    updated_at:      { type: String, required: true },
    image_url:       { type: String, required: true },
    gallery_urls:    [{ type: String }],
    brand:           { type: String, required: true },
    product_id:      { type: String, required: true },
    sku:             { type: String, required: true },
    model_type:      { type: String, required: true },
    model_size:      { type: String, required: true },
    min_stock:       { type: Number, required: true },
    stock:           { type: Number, required: true },
    price:           { type: Number, required: true },
    expiration_date: { type: String, required: true },
}, { _id: false });

export const ProductVariantSchema = mongoose.models.ProductVariant ||
    mongoose.model<ProductVariantSchemaType>('ProductVariant', ProductVariantMongoSchema, 'product_variants');
