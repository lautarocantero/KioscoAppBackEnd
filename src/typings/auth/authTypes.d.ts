
/*══════════════════════════════════════════════════════════════════════╗
║ 🧱 BASES 🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

//base con todos los tipos
interface AuthDocument {
  _id: string;
  username: string;
  email: string;
  password: string;
  repeatPassword: string;
  authToken: string;
  refreshToken: string;
}

//base con las funciones de db-local
interface AuthModelInterface extends AuthDocument {
  find(query: Partial<AuthDocument>): Promise<AuthDocument[]>;
  findOne(query: Partial<AuthDocument>): Promise<AuthDocument | null>;
  save(query?: Partial<AuthDocument>, data?: Partial<AuthDocument>): Promise<void>;
  remove(query?: Partial<AuthDocument>): Promise<void>;
}

//base con tipos unknown para los payloads
type AuthUnknown = Record<keyof AuthDocument, unknown>; 

/*══════════════════════════════════════════════════════════════════════╗
║ ✂️ DERIVADOS ✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️                ║
╚══════════════════════════════════════════════════════════════════════╝*/
// para no utilizar directamente el AuthDocument
export type Auth = AuthDocument;

export type AuthPublic = Omit<AuthDocument, 'password' | 'repeatPassword' | 'refreshToken'>

export type AuthModelType = AuthModelInterface;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type AuthSchemaType = Pick<AuthDocument, '_id' | 'username' | 'email' | 'password' | 'refreshToken'>;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type AuthRegisterPayload = Pick<AuthUnknown, 'username' | 'email' | 'password' | 'repeatPassword'>;

export type AuthLoginPayload = Pick<AuthUnknown, 'email' | 'password' >;

export interface AuthRefreshTokenPayload {
  _id: unknown,
  token?: unknown,
}

export type AuthCheckAuthPayload = Pick<AuthUnknown, '_id'>;

export type DeleteAuthPayload = Pick<AuthUnknown, '_id'>;

export type EditAuthPayload = Omit<AuthUnknown, 'repeatPassword' | 'authToken' | 'refreshToken'>;

export interface AuthLogoutPayload {
  cookies: {
    refresh_token: unknown,
  }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type AuthRegisterRequest = Request<AuthParams, unknown, AuthRegisterPayload>;

export type AuthLoginRequest = Request<AuthParams, unknown, AuthLoginPayload>;

export type AuthLogoutRequest = Request<AuthParams, unknown, AuthLogoutPayload>;

export type AuthCheckAuthRequest = Request<AuthParams, unknown, AuthCheckAuthPayload>;

export type DeleteAuthRequest = Request<AuthParams, unknown, DeleteAuthPayload>;

export type EditAuthRequest = Request<AuthParmas, unknown, EditAuthPayload>;


/*══════════════════════════════════════════════════════════════════════╗
║ 🪙 TOKEN 🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type AuthTokenPublic = Pick<AuthDocument, 'refreshToken'>








