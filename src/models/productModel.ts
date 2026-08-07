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
──────────────────────────────*/

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
    ║            (regla de integridad del propio dominio product)║
    ║ 📤 Salida: void                                             ║
    ╚════════════════════════════════════════════════════════════╝*/

  static async delete(data: DeleteProductPayload): Promise<void> {
    const { _id } = data;

    const _idResult: string = Validation.stringValidation(_id, '_id');

    const deleted = await ProductMongo.findOneAndDelete({ _id: _idResult });

    if (!deleted) throw new Error('There is not any product with that id');

    await ProductMongo.deleteMany({ product_id: _idResult });
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
    const createdResult: string       = Validation.date(created_at, 'createdAt');
    const updatedAtResult: string     = Validation.date(updated_at, 'updatedAt');
    const brandResult: string         = Validation.stringValidation(brand, 'brand');

    const updated = await ProductMongo.findOneAndUpdate(
      { _id: _idResult },
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