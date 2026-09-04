import { SellerPublic } from '@typings/seller';
import { KioscoPlanEnum, KioscoPlanStatusEnum } from '@typings/membership/enums';

interface AuthEntity {
  _id: string; // == Seller._id
  email: string;
  password: string;
  refreshToken: string | undefined;
  isVerified: boolean;
  verificationToken: string | null;
  verificationTokenExpires: Date | null;
  resetPasswordToken: string | null;
  resetPasswordTokenExpires: Date | null;
  // Tier de suscripción de la CUENTA (no del kiosco): un usuario puede ser
  // dueño/miembro de varios kioscos, pero paga un único plan. Default 'standard'.
  plan: KioscoPlanEnum;
  plan_status: KioscoPlanStatusEnum;
  // Id de la última suscripción (preapproval) creada en Mercado Pago para
  // esta cuenta. null si nunca inició un checkout.
  mp_preapproval_id: string | null;
}

type AuthSchema = AuthEntity;

interface AuthRepository extends AuthSchema {
  find(query: Partial<AuthSchema>): Promise<AuthSchema[]>;
  findOne(query: Partial<AuthSchema>): Promise<AuthSchema | null>;
  save(query?: Partial<AuthSchema>, data?: Partial<AuthSchema>): Promise<void>;
  remove(query?: Partial<AuthSchema>): Promise<void>;
}

type AuthPayloadUnknown = Record<keyof AuthEntity, unknown>;

export type Auth = AuthEntity;
export type AuthSchemaType = AuthSchema;
export type AuthModelType = AuthRepository;

// Lo mínimo indispensable, sin secretos ni tokens
export type AuthPublic = Omit<AuthEntity,
  | 'password' | 'refreshToken'
  | 'verificationToken' | 'verificationTokenExpires'
  | 'resetPasswordToken' | 'resetPasswordTokenExpires'
>;

// Lo que efectivamente vuelve al cliente en login/checkAuth: identidad + perfil
export type SessionUser = AuthPublic & SellerPublic;

export type AuthPayload = AuthPayloadUnknown;

export type AuthPublicSchema = Pick<Auth, '_id' | 'email' | 'isVerified'>;

/*═══ PAYLOADS ═══*/

// register ahora crea Auth + Seller juntos: por eso incluye datos de perfil
export type AuthRegisterPayload = {
  email: string;
  password: string;
  repeatPassword: string;
  name: string;
  profilePhoto?: string;
};

export type AuthLoginPayload = Pick<Auth, 'email' | 'password'> & {
    rememberMe: boolean;
};

export interface AuthGoogleLoginPayload {
    email: string;
    name: string;
    profilePhoto?: string;
}

export interface AuthLogoutPayload {
  cookies: {
    refresh_token: unknown,
  }
}

export type AuthCheckAuthPayload = Pick<AuthPayload, '_id'>;

export type DeleteAuthPayload = Pick<AuthPayload, '_id'>;

// Editar Auth ahora es SOLO email/password (self-service). name/foto se editan vía Seller,
// role vive en KioscoMembership (ver PUT /kiosco/:kiosco_id/member/:user_id/role).
// `_id` nunca viaja en el body: el controller lo deriva de la sesión
// (req.user.id), igual que deleteAuth — ver EditAuthRequestBody para el
// shape que sí puede mandar el cliente.
export type EditAuthPayload = {
  _id: string;
  email?: string;
  password?: string;
};

export type EditAuthRequestBody = Omit<EditAuthPayload, '_id'>;

export type VerifyEmailPayload = {
  token: string;
};

export type RequestPasswordResetPayload = Pick<Auth, 'email'>;

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
  repeatNewPassword: string;
};

/*═══ REQUESTS ═══*/

export type AuthRegisterRequest = Request<AuthParams, unknown, AuthRegisterPayload>;
export type AuthLoginRequest = Request<AuthParams, unknown, AuthLoginPayload>;
export type AuthGoogleRequest = Request<unknown, unknown, { accessToken: string }>;
export type AuthLogoutRequest = Request<AuthParams, unknown, AuthLogoutPayload>;
export type AuthCheckAuthRequest = Request<AuthParams, unknown, AuthCheckAuthPayload>;
export type AuthRefreshRequest = Request<AuthParams, unknown, unknown>;
export type DeleteAuthRequest = Request<AuthParams, unknown, DeleteAuthPayload>;
export type EditAuthRequest = Request<AuthParams, unknown, EditAuthRequestBody>;
export type VerifyEmailRequest = Request<AuthParams, unknown, VerifyEmailPayload>;
export type RequestPasswordResetRequest = Request<AuthParams, unknown, RequestPasswordResetPayload>;
export type ResetPasswordRequest = Request<AuthParams, unknown, ResetPasswordPayload>;

export interface AuthRefreshTokenPayload {
  _id: unknown,
  token?: unknown,
}

export type AuthTokenPublic = Pick<Auth, 'refreshToken'>;