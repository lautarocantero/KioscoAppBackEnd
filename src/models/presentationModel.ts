import { PresentationSchemaType, presentation } from '@typings/presentation';
import { Validation } from './validation';
import { ModelType, ModelUnit, PresentationCategory, SaleType } from '../typings/presentation/presentationEnum';
import { PresentationMongo } from '../schemas/presentationSchema';

/*──────────────────────────────
🎭 PresentationModel — Mongoose
──────────────────────────────
📜 Propósito: Gestión completa de presentaciones de producto contra MongoDB
🧩 Dependencias: PresentationMongo (schemas/presentationSchema), Validation
──────────────────────────────*/

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

  static async getPresentationsByCategory(category: PresentationCategory): Promise<presentation[]> {
    const results = await PresentationMongo.find({ category }).lean();
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
      ],
    }).lean();

    return results as unknown as presentation[];
  }

  static async getPresentationsWithStockByProductId(product_id: string): Promise<presentation[]> {
      Validation.stringValidation(product_id, 'product_id');

      const results = await PresentationMongo.find({
        product_id,
        stock: { $gt: 0 },
      }).lean();

      return results as unknown as presentation[];
  }

  //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

  static async create(data: {
      product_id: string; sku?: string; name: string; description?: string;
      barcode?: string; brand?: string; image_url?: string; model_type?: ModelType; model_size?: number;
      model_unit?: ModelUnit; is_perishable: boolean; min_stock: number; stock: number; price: number;
      expiration_date?: string; category?: PresentationCategory[]; sale_type: SaleType;
  }): Promise<string> {
      const {
          product_id, sku, name, description, barcode, brand, image_url,
          model_type, model_size, model_unit, is_perishable, min_stock, stock, price, expiration_date,
          category, sale_type,
      } = data;

      const productIdResult    = Validation.stringValidation(product_id, 'product_id');
      const barcodeResult      = barcode?.trim() || '';
      const skuResult          = sku?.trim() || '';
      const nameResult         = Validation.stringValidation(name, 'name');
      const descriptionResult  = Validation.stringValidation(description, 'description');
      const saleTypeResult     = Validation.saleType(sale_type);

      // model_type/model_size/model_unit ya no se validan como obligatorios acá:
      // el schema de Mongoose decide si son requeridos según sale_type.
      // undefined (no '') para que Mongoose no corra el enum-check en presentaciones por peso.
      const modelTypeResult = model_type || undefined;
      const modelSizeResult = model_size !== undefined ? Number(model_size) : undefined;
      const modelUnitResult = model_unit || undefined;
      const isPerishableResult = Boolean(is_perishable);

      const minStockResult = Validation.number(min_stock, 'min_stock', true); // isZeroValid: 0 kg/g de stock inicial es válido
      const stockResult    = Validation.number(stock, 'stock', true);
      const priceResult    = Validation.number(price, 'price');

      // expiration_date solo se exige si el producto es perecedero
      const expirationDateResult = isPerishableResult
        ? Validation.stringValidation(expiration_date, 'expiration_date')
        : (expiration_date ?? '');

      const _id = crypto.randomUUID();
      const now = new Date().toISOString();

      await PresentationMongo.create({
          _id,
          product_id: productIdResult,
          sku: skuResult,
          barcode: barcodeResult ?? '',
          name: nameResult,
          description: descriptionResult ?? '',
          brand: brand ?? '',
          image_url: image_url ?? '',
          model_type: modelTypeResult,
          model_size: modelSizeResult,
          model_unit: modelUnitResult,
          sale_type: saleTypeResult,
          is_perishable: isPerishableResult,
          min_stock: minStockResult,
          stock: stockResult,
          price: priceResult,
          category: category ?? [],
          status: stockResult > 0 ? 'available' : 'out_of_stock',
          created_at: now,
          updated_at: now,
          expiration_date: expirationDateResult,
      });

      return _id;
  }

  //──────────────────────────────────────────── 📦 STOCK 📦 ───────────────────────────────────────────//

  static async decreaseStock(items: { _id: string; stock_required: number }[]): Promise<void> {
    for (const { _id, stock_required } of items) {
      const idResult = Validation.stringValidation(_id, '_id');
      const qtyResult = Validation.number(stock_required, 'stock_required');

      const presentation = await PresentationMongo.findOne({ _id: idResult }).lean();
      if (!presentation) throw new Error(`No existe presentación con id ${idResult}`);

      const isWeight = presentation.sale_type === 'weight';

      // stock_required ya viene en gramos reales para productos por peso
      // (el frontend dejó de mandarlo en bloques de 100g).
      const newStock = presentation.stock - qtyResult;
      if (newStock < 0) throw new Error(`Stock insuficiente para la presentación ${idResult}`);

      await PresentationMongo.findOneAndUpdate(
        { _id: idResult },
        {
          $set: {
            stock: newStock,
            ...(isWeight ? { model_size: newStock } : {}),
            status: newStock > 0 ? 'available' : 'out_of_stock',
            updated_at: new Date().toISOString(),
          },
        },
      );
    }
  }

  //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

  static async delete(data: { _id: string }): Promise<void> {
    const _idResult = Validation.stringValidation(data._id, '_id');
    const deleted = await PresentationMongo.findOneAndDelete({ _id: _idResult });
    if (!deleted) throw new Error('There is not any presentation with that id');
  }

  //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

  static async edit(data: {
    _id: string; sku?: string; barcode?: string; price: number; stock: number; min_stock: number;
    model_type?: ModelType; model_size: number; model_unit?: ModelUnit; is_perishable: boolean;
    image_url?: string; brand?: string; description?: string; expiration_date?: string; name: string;
    category?: PresentationCategory[]; sale_type: string;
  }): Promise<void> {
    const {
      _id, barcode, sku, price, stock, min_stock,
      model_type, model_size, model_unit, is_perishable, image_url,
      brand, description, expiration_date, name,
      category, sale_type,
    } = data;

    const idResult         = Validation.stringValidation(_id, '_id');
    const nameResult       = Validation.stringValidation(name, 'name');
    const descriptionResult= Validation.stringValidation(description, 'description');
    const barcodeResult    = barcode?.trim() || '';
    const skuResult        = sku?.trim() || '';
    const priceResult      = Validation.number(price, 'price');
    const stockResult      = Validation.number(stock, 'stock');
    const minStockResult   = Validation.number(min_stock, 'min_stock');
    const isPerishableResult = Boolean(is_perishable);

    // ⬇️ model_type/model_size/model_unit solo se validan/exigen si NO es venta por peso
    const isWeight = sale_type === 'weight';
    const modelTypeResult = isWeight ? undefined : Validation.stringValidation(model_type, 'model_type');
    const modelSizeResult = isWeight ? Number(model_size) : Validation.number(model_size, 'model_size');
    const modelUnitResult = isWeight ? undefined : Validation.stringValidation(model_unit, 'model_unit');

    // expiration_date solo se exige si el producto es perecedero
    const expirationDateResult = isPerishableResult
      ? Validation.stringValidation(expiration_date, 'expiration_date')
      : (expiration_date ?? '');

    const updated = await PresentationMongo.findOneAndUpdate(
      { _id: idResult },
      {
        $set: {
          sku: skuResult,
          barcode: barcodeResult  ?? '',
          name: nameResult,
          model_type: modelTypeResult,
          model_size: modelSizeResult,
          model_unit: modelUnitResult,
          is_perishable: isPerishableResult,
          brand: brand ?? '',
          description: descriptionResult ?? '',
          price: priceResult,
          stock: stockResult,
          min_stock: minStockResult,
          category: category ?? [],
          status: stockResult > 0 ? 'available' : 'out_of_stock',
          image_url: image_url ?? '',
          updated_at: new Date().toISOString(),
          expiration_date: expirationDateResult,
          sale_type,
        },
      },
      { new: true },
    );

    if (!updated) throw new Error('There is not any presentation with that id');
  }
}