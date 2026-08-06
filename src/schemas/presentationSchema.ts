import mongoose, { Model, Schema } from 'mongoose';
import { PresentationSchemaType } from '@typings/presentation';
import { MODEL_TYPE_VALUES, MODEL_UNIT_VALUES, PRESENTATION_CATEGORY_VALUES, SALE_TYPE_VALUES } from '../typings/presentation/presentationEnum';

/*──────────────────────────────
🎭 PresentationMongoSchema
──────────────────────────────
📜 Propósito: Definición del schema Mongoose de presentaciones de producto.
🧩 Campos:
- _id             → Identificador único (String, requerido)
- product_id      → ID del producto padre (String, requerido)
- sku             → Código SKU de la presentación (String, requerido)
- barcode         → Código de barras (String, opcional)
- name            → Nombre de la presentación (String, requerido)
- description     → Descripción (String, opcional)
- brand           → Marca de la presentación (String, opcional)
- model_type      → Tipo de modelo/envase (String, enum MODEL_TYPE_VALUES, requerido salvo sale_type=weight)
- model_size      → Tamaño / cantidad numérica (Number, requerido salvo sale_type=weight)
- model_unit      → Unidad de medida (String, enum MODEL_UNIT_VALUES, requerido salvo sale_type=weight)
- category        → Categorías de la presentación (Array<String>, enum PRESENTATION_CATEGORY_VALUES)
- image_url       → URL de imagen principal (String, opcional)
- price           → Precio de venta unitario (Number, requerido)
- stock           → Unidades disponibles (Number, requerido)
- min_stock       → Punto mínimo de reposición (Number, requerido)
- status          → available | out_of_stock | unavailable (String, requerido)
- created_at      → Fecha de creación (String, requerido)
- updated_at      → Fecha de última actualización (String, requerido)
- expiration_date → Fecha de vencimiento (String, opcional)
──────────────────────────────*/

const PresentationMongoSchema = new Schema<PresentationSchemaType>({
  _id:             { type: String,   required: true },
  product_id:      { type: String,   required: true },
  sku:             { type: String,   required: true },
  barcode:         { type: String,   default: '' },
  name:            { type: String,   required: true },
  description:     { type: String,   default: '' },
  brand:           { type: String,   default: '' },
  model_type: {
    type: String,
    enum: MODEL_TYPE_VALUES,
    required: function (this: PresentationSchemaType) {
      return this.sale_type !== 'weight';
    },
  },
  model_size: {
    type: Number,
    required: function (this: PresentationSchemaType) {
      return this.sale_type !== 'weight';
    },
  },
  model_unit: {
    type: String,
    enum: MODEL_UNIT_VALUES,
    required: function (this: PresentationSchemaType) {
      return this.sale_type !== 'weight';
    },
  },
  category: {
    type:    [String],
    enum:    PRESENTATION_CATEGORY_VALUES,
    default: [],
  },
  sale_type: {
    type: String,
    enum: SALE_TYPE_VALUES,
    default: 'unit',
    required: true,
  },
  image_url:       { type: String,   default: '' },
  price:           { type: Number,   required: true },
  stock:           { type: Number,   required: true },
  min_stock:       { type: Number,   required: true },
  status: {
    type:    String,
    enum:    ['available', 'out_of_stock', 'unavailable'],
    required: true,
  },  
  created_at:      { type: String,   required: true },
  updated_at:      { type: String,   required: true },
  is_perishable:   { type: Boolean, required: true, default: true },
  expiration_date: {
    type: String,
    default: '',
    required: function (this: PresentationSchemaType) {
      return this.is_perishable === true;
    },
  },
}, { _id: false });

// Evitar re-compilación del modelo en hot-reload
export const PresentationMongo: Model<PresentationSchemaType> =
  mongoose.models.presentation as Model<PresentationSchemaType> ||
  mongoose.model<PresentationSchemaType>(
    'presentation',
    PresentationMongoSchema,
    'presentations',
  );