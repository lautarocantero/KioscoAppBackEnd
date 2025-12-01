// TO DO agregue la propiedad profilePhoto, agregarla a los endpoints
/*══════════════════════════════════════════════════════════════════════╗
║ 🔒 BASE PRINCIPAL 🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

//base
interface AuthEntity {
  _id: string;
  username: string;
  email: string;
  password: string;
  repeatPassword: string;
  authToken: string | undefined;
  refreshToken: string | undefined;
  profilePhoto: string | null;
}

// base para el schema
type AuthSchema = Pick<AuthEntity, '_id' | 'username' | 'email' | 'password' | 'refreshToken' | 'profilePhoto'>;

//base con las funciones del schema
interface AuthRepository extends AuthSchema {
  find(query: Partial<AuthSchema>): Promise<AuthSchema[]>;
  findOne(query: Partial<AuthSchema>): Promise<AuthSchema | null>;
  save(query?: Partial<AuthSchema>, data?: Partial<AuthSchema>): Promise<void>;
  remove(query?: Partial<AuthSchema>): Promise<void>;
}

//base para payloads
type AuthPayloadUnknown = Record<keyof AuthEntity, unknown>; 

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS 🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩                ║
╚══════════════════════════════════════════════════════════════════════╝*/

// derivado para no utilizar directamente el AuthEntity
export type Auth = AuthEntity;

// derivado para acceder al esquema
export type AuthSchemaType = AuthSchema;

//derivado para acceder a los metodos del esquema Auth
export type AuthModelType = AuthRepository;

// derivado para los datos publicos
export type AuthPublic = Omit<AuthEntity, 'password' | 'repeatPassword' | 'authToken' | 'refreshToken'>

//derivado para data de payloads y posterior validacion
export type AuthPayload = AuthPayloadUnknown;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type AuthPublicSchema = Pick<Auth, '_id' | 'username' | 'email' | 'profilePhoto'>;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type AuthRegisterPayload = Pick<AuthPayload, 'username' | 'email' | 'profilePhoto' | 'password' | 'repeatPassword'>;

export type AuthLoginPayload = Pick<AuthPayload, 'email' | 'password' >;

export interface AuthLogoutPayload {
  cookies: {
    refresh_token: unknown,
  }
}

export type AuthCheckAuthPayload = Pick<AuthPayload, '_id'>;

export type DeleteAuthPayload = Pick<AuthPayload, '_id'>;

export type EditAuthPayload = Omit<AuthPayload, 'repeatPassword' | 'authToken' | 'refreshToken'>;

export interface AuthRefreshTokenPayload {
  _id: unknown,
  token?: unknown,
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type AuthRegisterRequest = Request<AuthParams, unknown, AuthRegisterPayload>;

export type AuthLoginRequest = Request<AuthParams, unknown, AuthLoginPayload>;

export type AuthLogoutRequest = Request<AuthParams, unknown, AuthLogoutPayload>;

export type AuthCheckAuthRequest = Request<AuthParams, unknown, AuthCheckAuthPayload>;

export type DeleteAuthRequest = Request<AuthParams, unknown, DeleteAuthPayload>;

export type EditAuthRequest = Request<AuthParams, unknown, EditAuthPayload>;


/*══════════════════════════════════════════════════════════════════════╗
║ 🪙 TOKEN 🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type AuthTokenPublic = Pick<Auth, 'refreshToken'>








