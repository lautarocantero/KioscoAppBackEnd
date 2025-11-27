import DBLocal from "db-local";
import { SellSchemaType } from "../typings/sell/sellTypes";

const { Schema } = new DBLocal({ path: './db' });

export const SellSchema = Schema <SellSchemaType> ('Sell', {
    _id: { type: String, required: true},
    products: { type: Array, required: true},
    purchase_date: { type: String, required: true},
    seller_name: { type: String, required: true},
    total_amount: { type: Number, required: true},
});