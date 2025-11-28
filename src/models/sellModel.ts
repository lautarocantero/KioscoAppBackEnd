import { SellSchema } from "../schemas/sellSchema";
import { ProductVariant } from "../typings/product-variant/productVariantTypes";
import { CreateSellPayload, DeleteSellPayload, EditSellPayload, GetSellsByProductPayload, Sell, SellModelType } from "../typings/sell/sellTypes";
import { Validation } from "./validation";


export class SellModel {
/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

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

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

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

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

      static async delete ( data: DeleteSellPayload ) : Promise<void> {

        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const SellObject: SellModelType = SellSchema.findOne({ _id: _idResult });

        if(!SellObject) throw new Error('There is not any sell with that id');

        SellObject.remove();
      }

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
    
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
}