import { AuthSchemaType } from '../typings/auth';
import { AuthRoleEnum } from '../typings/auth/enums';
import mongoose, { Schema } from 'mongoose';

const AuthMongoSchema = new Schema<AuthSchemaType>({
  _id:          { type: String, required: true },
  username:     { type: String, required: true },
  email:        { type: String, required: true },
  password:     { type: String, required: true },
  refreshToken: { type: String, required: false },
  profilePhoto: { type: String, required: false },
  role:         {
    type: String,
    enum: Object.values(AuthRoleEnum),
    required: true,
    default: AuthRoleEnum.Usuario,
  },
  resetPasswordToken: {
    type: String,
    required: false,
    default: null,
  },
  resetPasswordTokenExpires: {
    type: Date,
    required: false,
    default: null,
  },
}, { _id: false });

export const AuthSchema = mongoose.models.Auth || 
  mongoose.model<AuthSchemaType>('Auth', AuthMongoSchema, 'auth');