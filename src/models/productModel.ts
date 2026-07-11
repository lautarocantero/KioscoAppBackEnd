import mongoose, { Schema } from 'mongoose';
import { CreateProductPayload, DeleteProductPayload, EditProductPayload, Product } from "@typings/product";
import { Validation } from "./validation";
import { PresentationSchema } from './presentationModel';


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
const ProductMongo = mongoose.models.Product || mongoose.model('Product', ProductMongoSchema, 'products');


// ─── ProductModel ─────────────────────────────────────────────────

export class ProductModel {

  //──────────────────────────────────────────── 🔧 HELPERS 🔧 ───────────────────────────────────────────//
  // to do mover a presentation 
  
  /*══════════ 🎮 buildPresentationsLookupStage ══════════╗
  ║ 📥 Entrada: ninguna                                    ║
  ║ ⚙️ Proceso: arma el stage $lookup reutilizable que      ║
  ║            trae presentations resumidas (sku, name,    ║
  ║            description, model_type, model_size, stock) ║
  ║            para el producto cuyo _id coincide con      ║
  ║            product_id de la presentation                ║
  ║ 📤 Salida: objeto stage $lookup para usar en aggregate  ║
  ╚═══════════════════════════════════════════════════════╝*/

  private static buildPresentationsLookupStage() {
    return {
      $lookup: {
        from: 'presentations',
        let: { productId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$product_id', '$$productId'] } } },
          {
            $project: {
              _id: 0,
              sku: 1,
              name: 1,
              description: 1,
              model_type: 1,
              model_size: 1,
              stock: 1,
            },
          },
        ],
        as: 'presentations',
      },
    };
  }

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

    /*══════════ 🎮 searchByField ══════════╗
  ║ 📥 Entrada: field, value (string)      ║
  ║ ⚙️ Proceso: busca coincidencia parcial,║
  ║            case-insensitive            ║
  ║ 📤 Salida: Product[]                   ║
  ╚═════════════════════════════════════════╝*/

  static async searchByField(
    field: 'name' | 'brand',
    value: string,
  ): Promise<Product[]> {

    Validation.stringValidation(value, field);

    const results = await ProductMongo.find({
      [field]: { $regex: value, $options: 'i' }
    }).lean();

    return results as unknown as Product[];
}

  /*══════════ 🎮 getProductsWithPresentations ══════════╗
  ║ 📥 Entrada: ninguna                                   ║
  ║ ⚙️ Proceso: trae productos + presentations (solo       ║
  ║            sku, name, description, model_type,        ║
  ║            model_size, stock) cuyo product_id          ║
  ║            coincida con el _id del producto            ║
  ║ 📤 Salida: Product[] (presentations resumidas)         ║
  ╚════════════════════════════════════════════════════════╝*/

  static async getProductsWithPresentations(): Promise<Product[]> {
    const results = await ProductMongo.aggregate([
      this.buildPresentationsLookupStage(),
      { $limit: 100 },
    ]);

    return results as unknown as Product[];
  }

  /*══════════ 🎮 searchProductsWithPresentations ══════════╗
  ║ 📥 Entrada: term (string)                                ║
  ║ ⚙️ Proceso: trae producto + presentations (igual que      ║
  ║            getProductsWithPresentations) y filtra en DB   ║
  ║            por $or: name del producto O name de alguna    ║
  ║            presentation, case-insensitive                 ║
  ║ 📤 Salida: Product[] (presentations resumidas)             ║
  ╚════════════════════════════════════════════════════════════╝*/

  static async searchProductsWithPresentations(term: string): Promise<Product[]> {
    Validation.stringValidation(term, 'term');

    const regex = { $regex: term, $options: 'i' };

    const results = await ProductMongo.aggregate([
      this.buildPresentationsLookupStage(),
      {
        $match: {
          $or: [
            { name: regex },
            { 'presentations.name': regex },
          ],
        },
      },
      { $limit: 100 },
    ]);

    return results as unknown as Product[];
  }

  /*══════════ 🎮 getStats ══════════╗
    ║ 📥 Entrada: ninguna                                        ║
    ║ ⚙️ Proceso: cuenta el total de productos y cuántos de ellos ║
    ║            tienen al menos una presentation con stock      ║
    ║            por debajo de su min_stock                      ║
    ║ 📤 Salida: { totalProducts, lowStockProducts }              ║
    ╚═══════════════════════════════════════════════════════════╝*/

    static async getStats(): Promise<{ totalProducts: number; lowStockProducts: number }> {
      const totalProducts = await ProductMongo.countDocuments();

      const lowStockResult = await ProductMongo.aggregate([
        {
          $addFields: {
            lowStockPresentations: {
              $filter: {
                input: '$presentations',
                as: 'p',
                cond: { $lt: ['$$p.stock', '$$p.min_stock'] },
              },
            },
          },
        },
        { $match: { 'lowStockPresentations.0': { $exists: true } } },
        { $count: 'count' },
      ]);

      const lowStockProducts = lowStockResult[0]?.count ?? 0;

      return { totalProducts, lowStockProducts };
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
      image_url, brand,
    } = data;

    const nameResult: string        = Validation.stringValidation(name, 'name');
    const descriptionResult: string = Validation.stringValidation(description, 'description');
    const createdAtResult: string   = Validation.date(created_at, 'created_at');
    const updatedAtResult: string   = Validation.date(updated_at, 'updated_at');
    const brandResult: string       = Validation.stringValidation(brand, 'brand');

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
      brand:        brandResult,
    });

    return _id;
  }

  //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

  /*══════════ 🎮 delete ══════════╗
    ║ 📥 Entrada: DeleteProductPayload {_id}                    ║
    ║ ⚙️ Proceso: valida id, elimina el producto y en cascada    ║
    ║            todas las presentations con ese product_id      ║
    ║ 📤 Salida: void                                             ║
    ╚════════════════════════════════════════════════════════════╝*/

  static async delete(data: DeleteProductPayload): Promise<void> {
    const { _id } = data;

    const _idResult: string = Validation.stringValidation(_id, '_id');

    const deleted = await ProductMongo.findOneAndDelete({ _id: _idResult });

    if (!deleted) throw new Error('There is not any product with that id');

    await PresentationSchema.deleteMany({ product_id: _idResult });
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
      updated_at, image_url,
      brand
    } = data;

    const _idResult: string           = Validation.stringValidation(_id, '_id');
    const nameResult: string          = Validation.stringValidation(name, 'name');
    const descriptionResult: string   = Validation.stringValidation(description, 'description');
    const createdResult: string     = Validation.date(created_at, 'createdAt');
    const updatedAtResult: string     = Validation.date(updated_at, 'updatedAt');
    const brandResult: string         = Validation.stringValidation(brand, 'brand');

    const updated = await ProductMongo.findOneAndUpdate(
      { _id: _idResult },
      {
        $set: {
          name:         nameResult,
          description:  descriptionResult,
          created_at:   createdResult, // esto antes pasaba created_at, puede que haya una razon para eso pero no recuerdo.
          updated_at:   updatedAtResult,
          image_url:    image_url as string,
          brand:        brandResult,
        }
      },
      { new: true } // devuelve el documento actualizado
    );

    if (!updated) throw new Error('There is not any product with that id');
  }
}