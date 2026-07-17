import { Product } from "@typings/product";
import { Validation } from "../models/validation";
import { ProductMongo } from "../models/productModel";

/*──────────────────────────────
🗂️ CatalogService
──────────────────────────────
📜 Propósito:
Único lugar del backend que sabe que "products" y "presentations" están
relacionados. Ni ProductModel ni PresentationModel deben conocerse entre sí:
todo cruce de datos entre ambos dominios vive acá.

Si mañana esta relación cambia de forma (ej. se agrega un tercer dominio,
o se pasa a otra DB), solo se toca este archivo.
──────────────────────────────*/

export class CatalogService {

  //──────────────────────────────────────────── 🔧 HELPERS 🔧 ───────────────────────────────────────────//

  /*══════════ 🎮 buildPresentationsLookupStage ══════════╗
  ║ 📥 Entrada: ninguna                                    ║
  ║ ⚙️ Proceso: arma el stage $lookup reutilizable que      ║
  ║            trae presentations resumidas (sku, name,    ║
  ║            description, model_type, model_size, stock, ║
  ║            min_stock) para el producto cuyo _id         ║
  ║            coincide con product_id de la presentation   ║
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
              min_stock: 1,
            },
          },
        ],
        as: 'presentations',
      },
    };
  }

  //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

  /*══════════ 🎮 getProductsWithPresentations ══════════╗
  ║ 📥 Entrada: ninguna                                   ║
  ║ ⚙️ Proceso: trae productos + presentations (resumidas) ║
  ║            cuyo product_id coincida con el _id del     ║
  ║            producto                                    ║
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
  ║ 🐛 Fix: antes faltaba el $lookup, por lo que                ║
  ║        "$presentations" siempre era undefined y             ║
  ║        lowStockProducts daba 0 siempre.                     ║
  ║ 📤 Salida: { totalProducts, lowStockProducts }              ║
  ╚═══════════════════════════════════════════════════════════╝*/

  static async getStats(): Promise<{ totalProducts: number; lowStockProducts: number }> {
    const totalProducts = await ProductMongo.countDocuments();

    const lowStockResult = await ProductMongo.aggregate([
      this.buildPresentationsLookupStage(),
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
}