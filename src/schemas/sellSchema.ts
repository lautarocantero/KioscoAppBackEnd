import mongoose, { Schema } from 'mongoose';
import { SellSchemaType } from '@typings/sell';

const PresentationSubSchema = new Schema({}, { strict: false, _id: false });

const SellMongoSchema = new Schema<SellSchemaType>({
  _id:                  { type: String, required: true },
  currency:             { type: String, required: true },
  iva:                  { type: Number, required: true },
  modification_date:    { type: String, required: false },
  payment_method:       { type: String, required: true },
  products:             { type: [PresentationSubSchema], required: true },
  purchase_date:        { type: String, required: true },
  seller_id:            { type: String, required: true },
  seller_name:          { type: String, required: true },
  sub_total:            { type: Number, required: true },
  total_amount:         { type: Number, required: true },
  status:               { type: String, required: true, default: 'completada' },
  amount_paid:          { type: Number, required: false, default: null },
  debtor_name:          { type: String, required: false, default: null },
}, { timestamps: true });


export const SellSchema = mongoose.models.Sell ||
    mongoose.model<SellSchemaType>('Sell', SellMongoSchema, 'sells');