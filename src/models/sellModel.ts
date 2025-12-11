import { SellSchema } from "../schemas/sellSchema";
import { ProductVariant } from "../typings/product-variant/productVariantTypes";
import { 
    CreateSellPayload, 
    DeleteSellPayload, 
    EditSellPayload, 
    GetSellsByProductPayload, 
    Sell, 
    SellModelType 
} from "../typings/sell/sellTypes";
import { Validation } from "./validation";

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
📚 Tipos usados en Sell
──────────────────────────────
- Sell: entidad principal de venta
- SellModelType: instancia del modelo en BD
- CreateSellPayload: payload para crear venta
- DeleteSellPayload: payload para eliminar venta
- EditSellPayload: payload para editar venta
- GetSellsByProductPayload: payload para obtener ventas por producto
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
[delete] → elimina venta por _id
[edit] → actualiza datos validados de venta
──────────────────────────────*/

export class SellModel {

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

    /*══════════ 🎮 getSells ══════════╗
    ║ 📥 Entrada: ninguna                  ║
    ║ ⚙️ Proceso: obtiene hasta 100 ventas de SellSchema ║
    ║ 📤 Salida: Sell[]                    ║
    ║ 🛠️ Errores: ninguno explícito        ║
    ╚═════════════════════════════════════╝*/
    static async getSells () : Promise <Sell[]> {
        let count = 0;
        const results: Sell[] = [];

        SellSchema.find((item: Sell ) => {
            if(count < 100) {
                results.push(item);
                count++;
                return true;
            }
            return false;
        });

        return results as Sell[];
    }

    /*══════════ 🎮 getSellsByField ══════════╗
    ║ 📥 Entrada: field, value, type ('string'|'number') ║
    ║ ⚙️ Proceso: valida tipo y busca ventas por campo   ║
    ║ 📤 Salida: Sell[]                                  ║
    ║ 🛠️ Errores: tipo no soportado, validaciones fallidas ║
    ╚════════════════════════════════════════════════════╝*/
    static async getSellsByField<T extends keyof Sell>(
        field: T,
        value: Sell[T],
        type: 'string' | 'number',
    ): Promise<Sell[]> {
        if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
        if (type === 'string') Validation.stringValidation(value, field as string);
        if (type === 'number') Validation.number(value, field as string);

        const results: Sell[] = [];
        SellSchema.find((item: Sell) => {
            if (item?.[field] === value) {
                results.push(item);
                return true;
            }
            return false;
        });

        return results as Sell[];
    }

    /*══════════ 🎮 getSellsByProduct ══════════╗
    ║ 📥 Entrada: GetSellsByProductPayload {_id} ║
    ║ ⚙️ Proceso: valida id y busca ventas que incluyan ese producto ║
    ║ 📤 Salida: Sell[]                                               ║
    ║ 🛠️ Errores: ninguno explícito                                   ║
    ╚════════════════════════════════════════════════════════════════╝*/
    static async getSellsByProduct (data: GetSellsByProductPayload) : Promise <Sell[]> {
        const { _id } = data;
        let count = 0;
        const results: Sell[] = [];

        const _idResult: string = Validation.stringValidation(_id, '_id');

        SellSchema.find((item: Sell) => {
            if (count >= 100) return false;

            const hasProduct = item.products?.some(
                (product) => product._id === _idResult
            );

            if (hasProduct) {
                results.push(item);
                count++;
                return true;
            }

            return false;
        });

        return results as Sell[];
    }

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    
    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

    /*══════════ 🎮 create ══════════╗
    ║ 📥 Entrada: CreateSellPayload {products,purchase_date,seller_name,total_amount} ║
    ║ ⚙️ Proceso: valida campos, genera _id y guarda venta                            ║
    ║ 📤 Salida: string _id generado                                                  ║
    ║ 🛠️ Errores: validaciones fallidas                                               ║
    ╚════════════════════════════════════════════════════════════════════════════════╝*/
    static async create (data: CreateSellPayload): Promise <string> {
        const { products,purchase_date,seller_name,total_amount } = data;

        const productsResult: ProductVariant[] = Validation.isVariantArray(products);
        const purchaseDateResult: string = Validation.date(purchase_date, 'purchase date');
        const sellerNameResult: string = Validation.stringValidation(seller_name, 'seller name');
        const totalAmountResult: number = Validation.number(total_amount, 'total amount');

        const _id: string = crypto.randomUUID();

        SellSchema.create({
            _id,
            products: productsResult,
            purchase_date: purchaseDateResult,
            seller_name: sellerNameResult,
            total_amount: totalAmountResult,
        }).save();

        return _id as string;
    }

    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
    
    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

    /*══════════ 🎮 delete ══════════╗
    ║ 📥 Entrada: DeleteSellPayload {_id} ║
    ║ ⚙️ Proceso: valida id y elimina venta ║
    ║ 📤 Salida: void                        ║
    ║ 🛠️ Errores: venta no encontrada        ║
    ╚═══════════════════════════════════════╝*/
    static async delete ( data: DeleteSellPayload ) : Promise<void> {
        const { _id } = data;
        const _idResult: string = Validation.stringValidation(_id, '_id');
        const SellObject: SellModelType = SellSchema.findOne({ _id: _idResult });

        if(!SellObject) throw new Error('There is not any sell with that id');

        SellObject.remove();
    }

    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
    
    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

    /*══════════ 🎮 edit ══════════╗
    ║ 📥 Entrada: EditSellPayload {_id,products,purchase_date,seller_name,total_amount} ║
    ║ ⚙️ Proceso: valida campos y actualiza venta                                       ║
    ║ 📤 Salida: void                                                                   ║
    ║ 🛠️ Errores: venta no encontrada, validaciones fallidas                            ║
    ╚═════════════════════════════════════════════════════════════════════════════════╝*/
    static async edit (data: EditSellPayload) : Promise <void> {
        const { _id,products,purchase_date,seller_name,total_amount} = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');
        const productsResult: ProductVariant[] = Validation.isVariantArray(products);
        const purchaseDateResult: string = Validation.date(purchase_date, 'purchase_date');
        const sellerNameResult: string = Validation.stringValidation(seller_name, 'seller_name');
        const totalAmountResult: number = Validation.number(total_amount, 'total_amount');

        const SellObject: SellModelType = SellSchema.findOne({ _id: _idResult });
        if(!SellObject) throw new Error('There is not any sell with that id');

        SellObject.products = productsResult;
        SellObject.purchase_date = purchaseDateResult;
        SellObject.seller_name = sellerNameResult;
        SellObject.total_amount = totalAmountResult;

        SellObject.save();
    }

    //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//
    
}
