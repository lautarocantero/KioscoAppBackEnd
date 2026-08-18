import { CreateProductPayload, DeleteProductPayload, EditProductPayload, Product } from "@typings/product";
import { Validation } from "./validation";
import { ProductMongo } from "../schemas/productSchema";

/*──────────────────────────────
📦 ProductModel — Mongoose
──────────────────────────────
📜 Propósito: Gestión completa de productos contra MongoDB
🧩 Dependencias: ProductMongo (schemas/productSchema), Validation
⚠️ Este modelo solo conoce la colección "products".
Todo lo que combine products + presentations vive en services/catalogService.ts

🏪 Todas las consultas/escrituras van scoped por kiosco_id (resuelto por
requireKioscoContext, nunca confiado del body del cliente).
──────────────────────────────*/

export class ProductModel {

  //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

  static async getProducts(kioscoId: string): Promise<Product[]> {
    const results = await ProductMongo.find({ kiosco_id: kioscoId }).limit(100).lean();
    return results as unknown as Product[];
  }

  static async getProductByField<T extends keyof Product>(
    kioscoId: string,
    field: T,
    value: Product[T],
    type: 'string' | 'number',
  ): Promise<Product[]> {

    if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);

    if (type === 'string') Validation.stringValidation(value, field as string);
    if (type === 'number') Validation.number(value, field as string);

    const results = await ProductMongo.find({ kiosco_id: kioscoId, [field]: value }).lean();
    return results as unknown as Product[];
  }

  static async searchByField(
    kioscoId: string,
    field: 'name' | 'brand',
    value: string,
  ): Promise<Product[]> {

    Validation.stringValidation(value, field);

    const results = await ProductMongo.find({
      kiosco_id: kioscoId,
      [field]: { $regex: value, $options: 'i' }
    }).lean();

    return results as unknown as Product[];
  }

  //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

  static async create(kioscoId: string, data: CreateProductPayload): Promise<string> {
    const {
      name, description, created_at, updated_at,
      image_url, brand,
    } = data;

    const nameResult: string        = Validation.stringValidation(name, 'name');
    const descriptionResult: string = Validation.stringValidation(description, 'description');
    const createdAtResult: string   = Validation.date(created_at, 'created_at');
    const updatedAtResult: string   = Validation.date(updated_at, 'updated_at');
    const brandResult: string       = Validation.stringValidation(brand, 'brand');

    // Control de duplicados (dentro del mismo kiosco: otro kiosco puede tener el mismo nombre)
    const existing = await ProductMongo.findOne({ kiosco_id: kioscoId, name: nameResult }).lean();
    if (existing) throw new Error('product already exists');

    const _id = crypto.randomUUID();

    await ProductMongo.create({
      _id,
      kiosco_id:    kioscoId,
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

  static async delete(kioscoId: string, data: DeleteProductPayload): Promise<void> {
    const { _id } = data;

    const _idResult: string = Validation.stringValidation(_id, '_id');

    const deleted = await ProductMongo.findOneAndDelete({ _id: _idResult, kiosco_id: kioscoId });

    if (!deleted) throw new Error('There is not any product with that id');

    await ProductMongo.deleteMany({ product_id: _idResult });
  }

  //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

  static async edit(kioscoId: string, data: EditProductPayload): Promise<void> {
    const {
      _id, name, description, created_at,
      updated_at, image_url,
      brand
    } = data;

    const _idResult: string           = Validation.stringValidation(_id, '_id');
    const nameResult: string          = Validation.stringValidation(name, 'name');
    const descriptionResult: string   = Validation.stringValidation(description, 'description');
    const createdResult: string       = Validation.date(created_at, 'createdAt');
    const updatedAtResult: string     = Validation.date(updated_at, 'updatedAt');
    const brandResult: string         = Validation.stringValidation(brand, 'brand');

    const updated = await ProductMongo.findOneAndUpdate(
      { _id: _idResult, kiosco_id: kioscoId },
      {
        $set: {
          name:         nameResult,
          description:  descriptionResult,
          created_at:   createdResult,
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
