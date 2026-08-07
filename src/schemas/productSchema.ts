import mongoose, { Model, Schema } from 'mongoose';
import { Product } from "@typings/product";

/*──────────────────────────────
📦 ProductMongoSchema
──────────────────────────────
📜 Propósito: Definición del schema Mongoose de productos.
🧩 Campos:
- _id           → Identificador único (String, requerido)
- name          → Nombre del producto (String, requerido)
- description   → Descripción del producto (String, opcional)
- created_at    → Fecha de creación (String, opcional)
- updated_at    → Fecha de última actualización (String, opcional)
- image_url     → URL de imagen principal (String, opcional)
- brand         → Marca del producto (String, opcional)

🛡️ Notas:
- Este schema NO tiene campo "presentations". La relación producto↔presentación
  vive del lado de PresentationMongoSchema mediante "product_id".
- A diferencia de PresentationMongoSchema, acá NO se usa `Schema<T>` con un tipo
  genérico todavía: `ProductSchemaType` (typings/product) incluye "presentations"
  como campo requerido, pensado para el fallback de db-local, y forzaría ese campo
  también acá. Si se define un tipo específico para Mongo (sin "presentations"),
  reemplazar `Schema({...})` por `Schema<ProductMongoSchemaType>({...})`.
──────────────────────────────*/

const ProductMongoSchema = new Schema({
  _id:          { type: String, required: true },
  name:         { type: String, required: true },
  description:  { type: String },
  created_at:   { type: String },
  updated_at:   { type: String },
  image_url:    { type: String },
  brand:        { type: String },
}, { _id: false });

// Evitar re-compilación del modelo en hot-reload
export const ProductMongo: Model<Product> =
  mongoose.models.Product as Model<Product> ||
  mongoose.model<Product>(
    'Product',
    ProductMongoSchema,
    'products',
  );