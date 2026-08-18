import mongoose, { Schema } from 'mongoose';
import { NotificationSchemaType } from '@typings/notification';

const NotificationPayloadSubSchema = new Schema({}, { strict: false, _id: false });

const NotificationMongoSchema = new Schema<NotificationSchemaType>({
  _id:        { type: String, required: true },
  kiosco_id:  { type: String, required: true, index: true },
  type:    { type: String, required: true, enum: ['low_stock', 'sale'] },
  payload: { type: NotificationPayloadSubSchema, required: true },
  readBy:  { type: [String], required: true, default: [] },
}, { timestamps: true });

export const NotificationSchema = mongoose.models.Notification ||
    mongoose.model<NotificationSchemaType>('Notification', NotificationMongoSchema, 'notifications');
