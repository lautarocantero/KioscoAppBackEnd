import mongoose, { Schema } from 'mongoose';
import { ProductVariant } from "@typings/productVariant";
import { CreateProductPayload, DeleteProductPayload, EditProductPayload, Product } from "@typings/product";
import { Validation } from "./validation";

/*──────────────────────────────
📦 ProductModel — Mongoose
──────────────────────────────
📜 Propósito: Gestión completa de productos contra MongoDB
🧩 Dependencias: mongoose, Validation, productTypes
📂 Endpoints: GET, POST, DELETE, PUT
──────────────────────────────*/


// ─── Schema de Mongoose ───────────────────────────────────────────
// Refleja exactamente la estructura de tus JSON

const ProductVariantSchema = new Schema({
  _id:             { type: String, required: true },
  name:            { type: String, required: true },
  description:     { type: String },
  created_at:      { type: String },
  updated_at:      { type: String },
  image_url:       { type: String },
  gallery_urls:    [{ type: String }],
  brand:           { type: String },
  product_id:      { type: String },
  sku:             { type: String },
  model_type:      { type: String },
  model_size:      { type: String },
  min_stock:       { type: Number },
  stock:           { type: Number },
  price:           { type: Number },
  expiration_date: { type: String },
}, { _id: false }); // _id: false porque ya lo manejamos como string

const ProductMongoSchema = new Schema({
  _id:          { type: String, required: true },
  name:         { type: String, required: true },
  description:  { type: String },
  created_at:   { type: String },
  updated_at:   { type: String },
  image_url:    { type: String },
  gallery_urls: [{ type: String }],
  brand:        { type: String },
  variants:     [ProductVariantSchema],
}, { _id: false }); // _id: false porque usamos UUID string como _id

// Evitar re-compilación del modelo en hot-reload
const ProductMongo = mongoose.models.Product || mongoose.model('Product', ProductMongoSchema, 'products');


// ─── ProductModel ─────────────────────────────────────────────────

export class ProductModel {

  //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

  /*══════════ 🎮 getProducts ══════════╗
  ║ 📥 Entrada: ninguna                  ║
  ║ ⚙️ Proceso: obtiene hasta 100 productos de MongoDB ║
  ║ 📤 Salida: Product[]                 ║
  ╚═════════════════════════════════════╝*/

  static async getProducts(): Promise<Product[]> {
    const results = await ProductMongo.find().limit(100).lean();
    return results as unknown as Product[];
  }

  /*══════════ 🎮 getProductByField ══════════╗
  ║ 📥 Entrada: field, value, type            ║
  ║ ⚙️ Proceso: busca productos por campo     ║
  ║ 📤 Salida: Product[]                      ║
  ╚══════════════════════════════════════════╝*/

  static async getProductByField<T extends keyof Product>(
    field: T,
    value: Product[T],
    type: 'string' | 'number',
  ): Promise<Product[]> {

    if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);

    if (type === 'string') Validation.stringValidation(value, field as string);
    if (type === 'number') Validation.number(value, field as string);

    const results = await ProductMongo.find({ [field]: value }).lean();
    return results as unknown as Product[];
  }

  //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

  /*══════════ 🎮 create ══════════╗
  ║ 📥 Entrada: CreateProductPayload ║
  ║ ⚙️ Proceso: valida, controla duplicados, guarda en MongoDB ║
  ║ 📤 Salida: string _id generado   ║
  ╚══════════════════════════════════╝*/

  static async create(data: CreateProductPayload): Promise<string> {
    const {
      name, description, created_at, updated_at,
      image_url, gallery_urls, brand, variants
    } = data;

    const nameResult: string        = Validation.stringValidation(name, 'name');
    const descriptionResult: string = Validation.stringValidation(description, 'description');
    const createdAtResult: string   = Validation.date(created_at, 'created_at');
    const updatedAtResult: string   = Validation.date(updated_at, 'updated_at');
    const galleryUrlsResult: string[] = Validation.imageArray(gallery_urls);
    const brandResult: string       = Validation.stringValidation(brand, 'brand');
    const variantsResult: ProductVariant[] = Validation.isVariantArray(variants);

    // Control de duplicados
    const existing = await ProductMongo.findOne({ name: nameResult }).lean();
    if (existing) throw new Error('product already exists');

    const _id = crypto.randomUUID();

    await ProductMongo.create({
      _id,
      name:         nameResult,
      description:  descriptionResult,
      created_at:   createdAtResult,
      updated_at:   updatedAtResult,
      image_url:    image_url as string,
      gallery_urls: galleryUrlsResult,
      brand:        brandResult,
      variants:     variantsResult,
    });

    return _id;
  }

  //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

  /*══════════ 🎮 delete ══════════╗
  ║ 📥 Entrada: DeleteProductPayload {_id} ║
  ║ ⚙️ Proceso: valida id y elimina de MongoDB ║
  ║ 📤 Salida: void                            ║
  ╚════════════════════════════════════════════╝*/

  static async delete(data: DeleteProductPayload): Promise<void> {
    const { _id } = data;

    const _idResult: string = Validation.stringValidation(_id, '_id');

    const deleted = await ProductMongo.findOneAndDelete({ _id: _idResult });

    if (!deleted) throw new Error('There is not any product with that id');
  }

  //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

  /*══════════ 🎮 edit ══════════╗
  ║ 📥 Entrada: EditProductPayload ║
  ║ ⚙️ Proceso: valida campos y actualiza en MongoDB ║
  ║ 📤 Salida: void                                  ║
  ╚══════════════════════════════════════════════════╝*/

  static async edit(data: EditProductPayload): Promise<void> {
    const {
      _id, name, description, created_at,
      updated_at, image_url, gallery_urls,
      brand, variants
    } = data;

    const _idResult: string           = Validation.stringValidation(_id, '_id');
    const nameResult: string          = Validation.stringValidation(name, 'name');
    const descriptionResult: string   = Validation.stringValidation(description, 'description');
    const createdAtResult: string     = Validation.date(created_at, 'createdAt');
    const updatedAtResult: string     = Validation.date(updated_at, 'updatedAt');
    const imageUrlResult: string      = Validation.image(image_url);
    const galleryUrlsResult: string[] = Validation.imageArray(gallery_urls);
    const brandResult: string         = Validation.stringValidation(brand, 'brand');
    const variantsResult: ProductVariant[] = Validation.isVariantArray(variants);

    const updated = await ProductMongo.findOneAndUpdate(
      { _id: _idResult },
      {
        $set: {
          name:         nameResult,
          description:  descriptionResult,
          created_at:   createdAtResult,
          updated_at:   updatedAtResult,
          image_url:    imageUrlResult,
          gallery_urls: galleryUrlsResult,
          brand:        brandResult,
          variants:     variantsResult,
        }
      },
      { new: true } // devuelve el documento actualizado
    );

    if (!updated) throw new Error('There is not any product with that id');
  }
}