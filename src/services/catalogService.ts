import { Product } from "@typings/product";
import { ProductMongo } from "../models/productModel";
import { PresentationCategory, PRESENTATION_CATEGORY_VALUES } from "../typings/presentation/presentationEnum";
import { PipelineStage } from "mongoose";
import { PresentationMongo } from "schemas/presentationSchema";

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
  ║            min_stock, category) para el producto cuyo  ║
  ║            _id coincide con product_id de la           ║
  ║            presentation                                 ║
  ║ 📤 Salida: objeto stage $lookup para usar en aggregate  ║
  ╚═══════════════════════════════════════════════════════╝*/

  private static buildPresentationsLookupStage(): PipelineStage.Lookup {
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
              category: 1,
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

  /*══════════ 🎮 getProductsWithStock ══════════╗
  ║ 📥 Entrada: ninguna                                   ║
  ║ ⚙️ Proceso: idéntico a getProductsWithPresentations,   ║
  ║            pero filtra dejando solo productos que      ║
  ║            tengan al menos una presentation con        ║
  ║            stock > 0                                   ║
  ║ 📤 Salida: Product[] (presentations resumidas)         ║
  ╚════════════════════════════════════════════════════════╝*/

  static async getProductsWithStock(): Promise<Product[]> {
    const results = await ProductMongo.aggregate([
      this.buildPresentationsLookupStage(),
      { $match: { 'presentations.stock': { $gt: 0 } } },
      { $limit: 100 },
    ]);

    return results as unknown as Product[];
  }

  /*══════════ 🎮 searchProductsWithPresentations ══════════╗
  ║ 📥 Entrada: term (string), category (opcional)            ║
  ║ ⚙️ Proceso: trae producto + presentations (igual que      ║
  ║            getProductsWithPresentations), filtra en DB     ║
  ║            por $or: name del producto O name de alguna     ║
  ║            presentation, case-insensitive; si viene         ║
  ║            category, además exige que al menos una         ║
  ║            presentation la tenga en su array category      ║
  ║ 📤 Salida: Product[] (presentations resumidas)             ║
  ╚════════════════════════════════════════════════════════════╝*/

    static async searchProductsWithPresentations(term: string, category?: string): Promise<Product[]> {
    const hasTerm = term !== undefined && term.trim() !== "";
    const hasCategory = category !== undefined;

    if (!hasTerm && !hasCategory) {
      throw new Error('Debe proveerse term o category');
    }

    if (hasCategory) {
      const isValidCategory = PRESENTATION_CATEGORY_VALUES.includes(category as string);
      if (!isValidCategory) throw new Error(`Categoría inválida: ${category}`);
    }

    const pipeline: PipelineStage[] = [
      this.buildPresentationsLookupStage(),
    ];

    if (hasTerm) {
      const regex = { $regex: term, $options: 'i' };
      pipeline.push({
        $match: {
          $or: [
            { name: regex },
            { 'presentations.name': regex },
          ],
        },
      });
    }

    if (hasCategory) {
      pipeline.push({
        $match: {
          'presentations.category': category as PresentationCategory,
        },
      });
    }

    pipeline.push({ $limit: 100 });

    const results = await ProductMongo.aggregate(pipeline);

    return results as unknown as Product[];
}

  /*══════════ 🎮 getStats ══════════╗
  ║ 📥 Entrada: ninguna                                        ║
  ║ ⚙️ Proceso: cuenta el total de productos y cuántas          ║
  ║            presentaciones (en total, no productos) tienen  ║
  ║            stock por debajo de su min_stock                ║
  ║ 📤 Salida: { totalProducts, lowStockPresentations }         ║
  ╚═══════════════════════════════════════════════════════════╝*/

  static async getStats(): Promise<{ totalProducts: number; lowStockPresentations: number }> {
    const totalProducts = await ProductMongo.countDocuments();

    const lowStockPresentations = await PresentationMongo.countDocuments({
      $expr: { $lt: ['$stock', '$min_stock'] },
    });

    return { totalProducts, lowStockPresentations };
  }

}