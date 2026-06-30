import mongoose, { Schema } from 'mongoose';
import { PresentationSchemaType } from '@typings/presentation';

/*──────────────────────────────
🎭 PresentationSchema (DB Local — fallback offline)
──────────────────────────────
📜 Propósito:
Esquema Mongoose para presentationes de producto.
Opera como fallback local cuando no hay conexión al servidor SQL.

🧩 Campos:
── Identidad ──────────────────────────────────────────────────────────
- _id             → UUID generado en el modelo          (String, req)
- product_id      → ID del producto padre               (String, req)
- sku             → Código SKU de la presentación       (String, req)

── Presentación ───────────────────────────────────────────────────────
- name            → Nombre de la presentación           (String, req)
                    ej: "Botella 2,25l", "Lata 354ml"
- description     → Descripción opcional                (String, default "")
- brand           → Marca de la presentación             (String, default "")
- model_type      → Tipo de modelo/presentación          (String, req)
- model_size      → Tamaño / contenido neto               (String, req)
                    ej: "2,25l", "354ml", "500g"

── Imágenes ───────────────────────────────────────────────────────────
- image_url       → URL de imagen principal              (String, default "")
- gallery_urls    → URLs de galería                       (String[])

── Precios y Stock ─────────────────────────────────────────────────────
- price           → Precio de venta unitario              (Number, req)
- stock           → Unidades disponibles                  (Number, req)
- min_stock       → Punto mínimo de reposición             (Number, req)

── Estado ─────────────────────────────────────────────────────────────
- status          → available | out_of_stock | unavailable
                    out_of_stock se setea automáticamente al crear/editar
                    si stock === 0

── Fechas ─────────────────────────────────────────────────────────────
- created_at      → ISO string de creación              (String, req)
- updated_at      → ISO string de última edición        (String, req)
- expiration_date → Fecha de vencimiento opcional       (String, default "")
──────────────────────────────*/

const PresentationMongoSchema = new Schema<PresentationSchemaType>({
    // ── Identidad ──────────────────────────────────────────────────────
    _id:             { type: String,   required: true },
    product_id:      { type: String,   required: true },
    sku:             { type: String,   required: true },

    // ── Presentación ───────────────────────────────────────────────────
    name:            { type: String,   required: true },
    description:     { type: String,   default: '' },
    brand:           { type: String,   default: '' },
    model_type:      { type: String,   required: true },
    model_size:      { type: String,   required: true },

    // ── Imágenes ───────────────────────────────────────────────────────
    image_url:       { type: String,   default: '' },
    gallery_urls:    [{ type: String }],

    // ── Precios y Stock ──────────────────────────────────────────────────
    price:           { type: Number,   required: true },
    stock:           { type: Number,   required: true },
    min_stock:       { type: Number,   required: true },

    // ── Estado ─────────────────────────────────────────────────────────
    status: {
        type:    String,
        enum:    ['available', 'out_of_stock', 'unavailable'],
        required: true,
    },

    // ── Fechas ─────────────────────────────────────────────────────────
    created_at:      { type: String,   required: true },
    updated_at:      { type: String,   required: true },
    expiration_date: { type: String,   default: '' },

}, { _id: false });

export const PresentationSchema =
    mongoose.models.presentation ||
    mongoose.model<PresentationSchemaType>(
        'presentation',
        PresentationMongoSchema,
        'presentations',
    );