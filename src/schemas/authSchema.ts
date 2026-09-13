import { AuthSchemaType } from '../typings/auth';
import mongoose, { Schema } from 'mongoose';
// Import relativo (no @typings): acá se usa como VALOR (KioscoPlanEnum.Standard
// como default), y el alias solo resuelve en tiempo de compilación, no en
// runtime (ts-node-dev).
import { KioscoPlanEnum, KioscoPlanStatusEnum } from '../typings/membership/enums';

const AuthMongoSchema = new Schema<AuthSchemaType>({
  _id:          { type: String, required: true }, // == Seller._id
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  refreshToken: { type: String, required: false },
  isVerified:                { type: Boolean, required: true, default: false },
  verificationToken:         { type: String, required: false, default: null },
  verificationTokenExpires:  { type: Date,   required: false, default: null },
  resetPasswordToken:        { type: String, required: false, default: null },
  resetPasswordTokenExpires: { type: Date,   required: false, default: null },
  plan: {
    type: String,
    enum: Object.values(KioscoPlanEnum),
    required: true,
    default: KioscoPlanEnum.Standard,
  },
  plan_status: {
    type: String,
    enum: Object.values(KioscoPlanStatusEnum),
    required: true,
    default: KioscoPlanStatusEnum.Trial,
  },
  mp_preapproval_id: { type: String, required: false, default: null },
  // Fin del free trial de 7 días. null en cuentas viejas (migradas antes de
  // este campo) o que ya pagaron alguna vez y no deberían volver a trial.
  trial_ends_at: { type: Date, required: false, default: null },
}, { _id: false });

export const AuthSchema = mongoose.models.Auth ||
  mongoose.model<AuthSchemaType>('Auth', AuthMongoSchema, 'auth');