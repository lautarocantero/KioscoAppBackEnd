import mongoose, { Schema } from 'mongoose';
import { SellerSchemaType } from '@typings/seller';
import { SellerStatus } from '../typings/seller/sellerEnums';

const SellerMongoSchema = new Schema<SellerSchemaType>({
    _id:          { type: String, required: true }, // == Auth._id
    name:         { type: String, required: true },
    profilePhoto: { type: String, required: false, default: null },
    created_at:   { type: String, required: true },
    user_status: {
      type: String,
      enum: Object.values(SellerStatus),
      required: true,
      default: SellerStatus.offline,
    },
}, { _id: false });

export const SellerSchema = mongoose.models.Seller ||
    mongoose.model<SellerSchemaType>('Seller', SellerMongoSchema, 'sellers');