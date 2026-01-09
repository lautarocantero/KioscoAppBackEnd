
/*──────────────────────────────
💰 SellModel
──────────────────────────────
📜 Propósito: Gestión completa de ventas (creación, consulta, edición, eliminación)
🧩 Dependencias: SellSchema, Validation, sellTypes, productVariantTypes
📂 Endpoints: GET, POST, DELETE, PUT
🛡️ Seguridad:
   - Validaciones estrictas en todos los campos
   - Control de duplicados limitado a 100 resultados
   - Manejo seguro de productos, fechas y montos
──────────────────────────────*/

/*──────────────────────────────
📚 Tipos usados en SellType
──────────────────────────────
- SellType: entidad principal de venta
- SellModelType: instancia del modelo en BD
- CreateSellPayloadType: payload para crear venta
- DeleteSellPayloadType: payload para eliminar venta
- EditSellPayloadType: payload para editar venta
- GetSellsByProductPayloadType: payload para obtener ventas por producto
- ProductVariant: variantes de producto incluidas en la venta
──────────────────────────────*/

/*──────────────────────────────
🛡️ Seguridad
──────────────────────────────
🔒 Validar todos los campos antes de guardar
🗑️ Evitar duplicados y limitar resultados a 100
📦 Validar arrays de productos (ProductVariant[])
📅 Validar fechas de compra
💲 Validar montos numéricos
──────────────────────────────*/

/*──────────────────────────────
🌀 Flujo
──────────────────────────────
[getSells] → devuelve hasta 100 ventas
[getSellsByField] → busca ventas por campo validado
[getSellsByProduct] → busca ventas que incluyan un producto específico
[create] → valida campos, guarda venta
[delete] → elimina venta por ticket_id
[edit] → actualiza datos validados de venta
──────────────────────────────*/

import { ProductVariant } from "@typings/productVariant";
import {
    CreateSellPayloadType,
    DeleteSellPayloadType,
    EditSellPayloadType,
    GetSellsByProductPayloadType,
    SellModelType,
    SellRawPayloadType,
    SellType
} from "@typings/sell";
import { SellSchema } from "../schemas/sellSchema";
import { Validation } from "./validation";

export class SellModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    /*══════════ 🎮 getSells ══════════════════════════════╗
    ║ 📥 Entrada: ninguna                                 ║
    ║ ⚙️ Proceso: obtiene hasta 100 ventas de SellSchema ║
    ║ 📤 Salida: SellType[]                             ║
    ║ 🛠️ Errores: ninguno explícito                     ║
    ╚══════════════════════════════════════════════════╝*/

    static async getSells(limit = 100, offset = 0): Promise<SellType[]> {
      const results: SellType[] = [];
      let index = 0;
        
      SellSchema.find((item: SellType) => {
        if (index >= offset && results.length < limit) {
          results.push(item);
        }
        index++;
        return results.length < limit;
      });
  
      return results;
    }


    /*══════════ 🎮 getSellsByField ══════════╗
    ║ 📥 Entrada: field, value, type ('string'|'number') ║
    ║ ⚙️ Proceso: valida tipo y busca ventas por campo   ║
    ║ 📤 Salida: SellType[]                                  ║
    ║ 🛠️ Errores: tipo no soportado, validaciones fallidas ║
    ╚════════════════════════════════════════════════════╝*/

    /*─────────────────── 🔎 cambiar por sellType si no funciona🔎 ───────────────────*/

    static async getSellsByField<T extends keyof SellRawPayloadType>(field: T,value: SellRawPayloadType[T],type: 'string' | 'number',)
    : Promise<SellType[]> {

        if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
        if (type === 'string') Validation.stringValidation(value, field as string);
        if (type === 'number') Validation.number(value, field as string);

        const results: SellType[] = [];

        SellSchema.find((item: SellType) => {
            if (item?.[field] === value) {
                results.push(item);
                return true;
            }
            return false;
        });

        return results as SellType[];
    }

    /*══════════ 🎮 getSellsByProduct ═══════════════════════════════════════════════════════════╗
    ║ 📥 Entrada: GetSellsByProductPayloadType {ticket_id}                                      ║
    ║ ⚙️ Proceso: valida id y busca ventas que incluyan ese producto, no utiliza getSellsByField║
    ║  debido a que los productos estan por dentro del campo products                           ║
    ║ 📤 Salida: SellType[]                                                                     ║
    ║ 🛠️ Errores: ninguno explícito                                                             ║
    ╚══════════════════════════════════════════════════════════════════════════════════════════╝*/

    static async getSellsByProduct (data: GetSellsByProductPayloadType) : Promise <SellType[]> {
        const { ticket_id }: {ticket_id: unknown} = data;

        let count = 0;
        const results: SellType[] = [];

        const _idResult: string = Validation.stringValidation(ticket_id, 'ticket_id');

        SellSchema.find((item: SellType) => {
            if (count >= 100) return false;

            const hasProduct = item.products?.some(
                (product) => product.product_id === _idResult
            );

            if (hasProduct) {
                results.push(item);
                count++;
                return true;
            }

            return false;
        });

        return results as SellType[];
    }
    
    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

    /*══════════ 🎮 create ══════════╗
    ║ 📥 Entrada: CreateSellPayloadType {products,purchase_date,seller_name,total_amount} ║
    ║ ⚙️ Proceso: valida campos, genera ticket_id y guarda venta                            ║
    ║ 📤 Salida: string ticket_id generado                                                  ║
    ║ 🛠️ Errores: validaciones fallidas                                               ║
    ╚════════════════════════════════════════════════════════════════════════════════╝*/
    static async create (data: CreateSellPayloadType): Promise <string> {
        const { 
            currency,
            iva,
            payment_method,
            products,
            purchase_date,
            seller_id,
            seller_name,
            sub_total,
            total_amount,
         } = data;

        const productsResult: ProductVariant[] = Validation.isVariantArray(products);
        const purchaseDateResult: string = Validation.date(purchase_date, 'purchase date');
        const sellerIdResult: string = Validation.stringValidation(seller_id, 'seller id');
        const sellerNameResult: string = Validation.stringValidation(seller_name, 'seller name');
        const subTotalResult: number = Validation.number(sub_total, 'sub total');
        const ivaResult: number = Validation.number(iva, 'iva', true);
        const totalAmountResult: number = Validation.number(total_amount, 'total amount');
        const paymentMethodResult: string = Validation.stringValidation(payment_method, 'payment method');
        const currencyResult: string = Validation.stringValidation(currency, 'currency');

        const ticket_id: string = crypto.randomUUID();

        SellSchema.create({
            ticket_id: ticket_id,
            purchase_date: purchaseDateResult,
            modification_date: '',
            seller_id: sellerIdResult,
            seller_name: sellerNameResult,
            payment_method: paymentMethodResult,
            products: productsResult,
            sub_total: subTotalResult,
            iva: ivaResult, 
            total_amount: totalAmountResult,
            currency: currencyResult,
        }).save();

        return ticket_id as string;
    }
    
    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

    /*══════════ 🎮 delete ══════════╗
    ║ 📥 Entrada: DeleteSellPayloadType {ticket_id} ║
    ║ ⚙️ Proceso: valida id y elimina venta ║
    ║ 📤 Salida: void                        ║
    ║ 🛠️ Errores: venta no encontrada        ║
    ╚═══════════════════════════════════════╝*/
    static async delete ( data: DeleteSellPayloadType ) : Promise<void> {
        const { ticket_id } : { ticket_id : unknown }  = data;

        const _idResult: string = Validation.stringValidation(ticket_id, 'ticket_id');
        const SellObject: SellModelType = SellSchema.findOne({ ticket_id: _idResult });

        if(!SellObject) throw new Error(`There is not any sell with that id ${ticket_id}`);

        SellObject.remove();
    }
    
    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

    /*══════════ 🎮 edit ═════════════════════════════════════════════════════════════════════════╗
    ║ 📥 Entrada: EditSellPayloadType {ticket_id,products,purchase_date,seller_name,total_amount} ║
    ║ ⚙️ Proceso: valida campos y actualiza venta                                                 ║
    ║ 📤 Salida: void                                                                             ║
    ║ 🛠️ Errores: venta no encontrada, validaciones fallidas                                      ║
    ╚════════════════════════════════════════════════════════════════════════════════════════════╝*/

    static async edit (data: EditSellPayloadType) : Promise <void> {
        const { ticket_id,products,purchase_date,seller_name,total_amount} = data;

        const _idResult: string = Validation.stringValidation(ticket_id, 'ticket_id');
        const productsResult: ProductVariant[] = Validation.isVariantArray(products);
        const purchaseDateResult: string = Validation.date(purchase_date, 'purchase_date');
        const sellerNameResult: string = Validation.stringValidation(seller_name, 'seller_name');
        const totalAmountResult: number = Validation.number(total_amount, 'total_amount');

        const SellObject: SellModelType = SellSchema.findOne({ ticket_id: _idResult });
        if(!SellObject) throw new Error(`There is not any sell with that id ${ticket_id}`);

        SellObject.products = productsResult;
        SellObject.purchase_date = purchaseDateResult;
        SellObject.seller_name = sellerNameResult;
        SellObject.total_amount = totalAmountResult;

        SellObject.save();
    }
    
}
