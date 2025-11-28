
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
}

//base con las funciones de db-local
interface AuthRepository extends AuthEntity {
  find(query: Partial<AuthEntity>): Promise<AuthEntity[]>;
  findOne(query: Partial<AuthEntity>): Promise<AuthEntity | null>;
  save(query?: Partial<AuthEntity>, data?: Partial<AuthEntity>): Promise<void>;
  remove(query?: Partial<AuthEntity>): Promise<void>;
}

//base para payloads
type AuthPayloadUnknown = Record<keyof AuthEntity, unknown>; 

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS 🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩                ║
╚══════════════════════════════════════════════════════════════════════╝*/

// derivado para no utilizar directamente el AuthEntity
export type Auth = AuthEntity;

// derivado para los datos publicos
export type AuthPublic = Omit<AuthEntity, 'password' | 'repeatPassword' | 'refreshToken'>

//derivado para acceder a los metodos de Auth
export type AuthModelType = AuthRepository;

//derivado para data de payloads y posterior validacion
export type AuthPayload = AuthPayloadUnknown;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type AuthSchemaType = Pick<Auth, '_id' | 'username' | 'email' | 'password' | 'refreshToken'>;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type AuthRegisterPayload = Pick<AuthPayload, 'username' | 'email' | 'password' | 'repeatPassword'>;

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








