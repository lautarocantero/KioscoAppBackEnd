import mongoose, { Model, Schema } from 'mongoose';
import { PresentationSchemaType, presentation } from '@typings/presentation';
import { Validation } from './validation';

const PresentationMongoSchema = new Schema<PresentationSchemaType>({
  _id:             { type: String,   required: true },
  product_id:      { type: String,   required: true },
  sku:             { type: String,   required: true },
  name:            { type: String,   required: true },
  description:     { type: String,   default: '' },
  brand:           { type: String,   default: '' },
  model_type:      { type: String,   required: true },
  model_size:      { type: String,   required: true },
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
  expiration_date: { type: String,   default: '' },
}, { _id: false });

// Evitar re-compilación del modelo en hot-reload
export const PresentationMongo: Model<PresentationSchemaType> =
  mongoose.models.presentation as Model<PresentationSchemaType> ||
  mongoose.model<PresentationSchemaType>(
    'presentation',
    PresentationMongoSchema,
    'presentations',
  );


// ─── PresentationModel ─────────────────────────────────────────────
// ⚠️ Este modelo solo conoce la colección "presentations".
// Todo lo que combine presentation + sell (analíticas) vive en
// services/presentationAnalyticsService.ts — igual que CatalogService
// combina product + presentation.

export class PresentationModel {

  //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

  static async getPresentations(): Promise<presentation[]> {
    const results = await PresentationMongo.find().lean();
    return results as unknown as presentation[];
  }

  static async getPresentationByField<T extends keyof PresentationSchemaType>(
    field: T,
    value: PresentationSchemaType[T],
    type: 'string' | 'number',
  ): Promise<presentation[]> {

    if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);

    if (type === 'string') Validation.stringValidation(value, field as string);
    if (type === 'number') Validation.number(value, field as string);

    const results = await PresentationMongo.find({ [field]: value }).lean();
    return results as unknown as presentation[];
  }

  static async searchByProductIdAndTerm(product_id: string, term: string): Promise<presentation[]> {
    Validation.stringValidation(product_id, 'product_id');

    const regex = { $regex: term ?? '', $options: 'i' };

    const results = await PresentationMongo.find({
      product_id,
      $or: [
        { name: regex },
        { sku: regex },
        { model_type: regex },
        { model_size: regex },
      ],
    }).lean();

    return results as unknown as presentation[];
  }

  //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

  static async create(data: {
    product_id: string; sku: string; name: string; description?: string;
    brand?: string; image_url?: string; model_type: string; model_size: string;
    min_stock: number; stock: number; price: number; expiration_date?: string;
  }): Promise<string> {
    const {
      product_id, sku, name, description, brand, image_url,
      model_type, model_size, min_stock, stock, price, expiration_date,
    } = data;

    const productIdResult   = Validation.stringValidation(product_id, 'product_id');
    const skuResult         = Validation.stringValidation(sku, 'sku');
    const nameResult        = Validation.stringValidation(name, 'name');
    const descriptionResult = Validation.stringValidation(description, 'description');
    const modelTypeResult   = Validation.stringValidation(model_type, 'model_type');
    const modelSizeResult   = Validation.stringValidation(model_size, 'model_size');
    const minStockResult    = Validation.number(min_stock, 'min_stock');
    const stockResult       = Validation.number(stock, 'stock');
    const priceResult       = Validation.number(price, 'price');

    const _id = crypto.randomUUID();
    const now = new Date().toISOString();

    await PresentationMongo.create({
      _id,
      product_id: productIdResult,
      sku: skuResult,
      name: nameResult,
      description: descriptionResult ?? '',
      brand: brand ?? '',
      image_url: image_url ?? '',
      model_type: modelTypeResult,
      model_size: modelSizeResult,
      min_stock: minStockResult,
      stock: stockResult,
      price: priceResult,
      status: stockResult > 0 ? 'available' : 'out_of_stock',
      created_at: now,
      updated_at: now,
      expiration_date: expiration_date ?? '',
    });

    return _id;
  }

  //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

  static async delete(data: { _id: string }): Promise<void> {
    const _idResult = Validation.stringValidation(data._id, '_id');
    const deleted = await PresentationMongo.findOneAndDelete({ _id: _idResult });
    if (!deleted) throw new Error('There is not any presentation with that id');
  }

  //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

  static async edit(data: {
    _id: string; sku: string; price: number; stock: number; min_stock: number;
    model_type: string; model_size: string; image_url?: string;
    brand?: string; description?: string; expiration_date?: string; name: string;
  }): Promise<void> {
    const {
      _id, sku, price, stock, min_stock,
      model_type, model_size, image_url,
      brand, description, expiration_date, name,
    } = data;

    const idResult         = Validation.stringValidation(_id, '_id');
    const nameResult       = Validation.stringValidation(name, 'name');
    const descriptionResult= Validation.stringValidation(description, 'description');
    const skuResult        = Validation.stringValidation(sku, 'sku');
    const modelTypeResult  = Validation.stringValidation(model_type, 'model_type');
    const modelSizeResult  = Validation.stringValidation(model_size, 'model_size');
    const priceResult      = Validation.number(price, 'price');
    const stockResult      = Validation.number(stock, 'stock');
    const minStockResult   = Validation.number(min_stock, 'min_stock');

    const updated = await PresentationMongo.findOneAndUpdate(
      { _id: idResult },
      {
        $set: {
          sku: skuResult,
          name: nameResult,
          model_type: modelTypeResult,
          model_size: modelSizeResult,
          brand: brand ?? '',
          description: descriptionResult ?? '',
          price: priceResult,
          stock: stockResult,
          min_stock: minStockResult,
          status: stockResult > 0 ? 'available' : 'out_of_stock',
          image_url: image_url ?? '',
          updated_at: new Date().toISOString(),
          expiration_date: expiration_date ?? '',
        },
      },
      { new: true },
    );

    if (!updated) throw new Error('There is not any presentation with that id');
  }
}