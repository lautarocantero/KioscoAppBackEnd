import DBLocal from "db-local";
import { SellerSchemaType } from "../typings/seller/sellerTypes";

const { Schema } = new DBLocal({ path: './db'});

export const SellerSchema = Schema <SellerSchemaType> ('Seller', {
    _id: { type: String, required: true},
    name: { type: String, required: true},
    email: { type: String, required: true},
    password: { type: String, required: true},
    rol: { type: String, required: true},
    created_at: { type: String, required: true}, 
    user_status: { type: String, required: true},
});