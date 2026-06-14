import mongoose, { Schema } from 'mongoose';
import { ProductVariantSchemaType } from '@typings/productVariant';

/*──────────────────────────────
🎭 ProductVariantSchema (DB Local — fallback offline)
──────────────────────────────
📜 Propósito:
Esquema Mongoose para variantes de producto.
Opera como fallback local cuando no hay conexión al servidor SQL.

🧩 Campos:
── Identidad ──────────────────────────────────────────────────────────
- _id             → UUID generado en el modelo          (String, req)
- product_id      → ID del producto padre               (String, req)
- sku             → Código SKU de la presentación       (String, req)
- barcode         → Código de barras                    (String, req)

── Presentación ───────────────────────────────────────────────────────
- name            → Nombre de la presentación           (String, req)
                    ej: "Botella 2,25l", "Lata 354ml"
- description     → Descripción opcional                (String, default "")
- net_content     → Contenido neto / peso               (String, req)
                    ej: "2,25l", "354ml", "500g"

── Precios ────────────────────────────────────────────────────────────
- price           → Precio de venta unitario            (Number, req)
- purchase_price  → Precio de compra al proveedor       (Number, req)

── Stock ──────────────────────────────────────────────────────────────
- stock_current   → Unidades físicas en depósito        (Number, req)
- stock_available → Unidades libres (sin reservas)      (Number, req)
- reorder_point   → Punto de reposición                 (Number, req)

── Estado ─────────────────────────────────────────────────────────────
- status          → available | out_of_stock | unavailable
                    out_of_stock se setea automáticamente al crear/editar
                    si stock_current === 0

── Fechas ─────────────────────────────────────────────────────────────
- created_at      → ISO string de creación              (String, req)
- updated_at      → ISO string de última edición        (String, req)
- expiration_date → Fecha de vencimiento opcional       (String, default "")

── Proveedores ────────────────────────────────────────────────────────
- supplier_ids    → Array de IDs del módulo Providers   (String[])

🗑️ Campos eliminados:
- brand, image_url, gallery_urls, model_type, model_size, min_stock
──────────────────────────────*/

const ProductVariantMongoSchema = new Schema<ProductVariantSchemaType>({
    // ── Identidad ──────────────────────────────────────────────────────
    _id:             { type: String,   required: true },
    product_id:      { type: String,   required: true },
    sku:             { type: String,   required: true },
    barcode:         { type: String,   required: true },

    // ── Presentación ───────────────────────────────────────────────────
    name:            { type: String,   required: true },
    description:     { type: String,   default: '' },
    net_content:     { type: String,   required: true },

    // ── Precios ────────────────────────────────────────────────────────
    price:           { type: Number,   required: true },
    purchase_price:  { type: Number,   required: true },

    // ── Stock ──────────────────────────────────────────────────────────
    stock_current:   { type: Number,   required: true },
    stock_available: { type: Number,   required: true },
    reorder_point:   { type: Number,   required: true },

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

    // ── Proveedores ────────────────────────────────────────────────────
    supplier_ids:    [{ type: String }],

}, { _id: false });

export const ProductVariantSchema =
    mongoose.models.ProductVariant ||
    mongoose.model<ProductVariantSchemaType>(
        'ProductVariant',
        ProductVariantMongoSchema,
        'product_variants',
    );