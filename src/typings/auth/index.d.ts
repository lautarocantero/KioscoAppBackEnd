/*──────────────────────────────
📘 AuthTypes
──────────────────────────────
📜 Propósito:
Tipado base para autenticación.  
Define entidades, esquemas, repositorios, payloads y requests.
c
🧩 Derivaciones:
- AuthEntity → AuthSchema → AuthRepository → AuthModelType
- AuthEntity → AuthPublic → AuthPublicSchema
- AuthEntity → AuthPayload → Payloads → Requests

🛡️ Seguridad:
- Usar AuthPublic/AuthPublicSchema para ocultar campos sensibles.
- Validar siempre los payloads antes de persistir.
- `role` NUNCA debe aceptarse desde AuthRegisterPayload ni desde el body de un request de
  registro: se asigna un default en AuthModel.create para evitar que un usuario se auto-asigne
  un rol privilegiado. Solo EditAuthPayload (uso administrativo) lo permite editar.
──────────────────────────────*/

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
  role: AuthRoleEnum;
}

// base para el schema
type AuthSchema = Pick<AuthEntity, '_id' | 'username' | 'email' | 'password' | 'refreshToken' | 'profilePhoto' | 'role'>;

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

export type AuthPublicSchema = Pick<Auth, '_id' | 'username' | 'email' | 'profilePhoto' | 'role'>;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

// role NO forma parte de AuthRegisterPayload a propósito (ver nota de seguridad arriba).
export type AuthRegisterPayload = Pick<AuthPayload, 'username' | 'email' | 'profilePhoto' | 'password' | 'repeatPassword'>;

export type AuthLoginPayload = Pick<AuthPayload, 'email' | 'password' >;

export interface AuthLogoutPayload {
  cookies: {
    refresh_token: unknown,
  }
}

export type AuthCheckAuthPayload = Pick<AuthPayload, '_id'>;

export type DeleteAuthPayload = Pick<AuthPayload, '_id'>;

// EditAuthPayload SÍ incluye 'role' (hereda de AuthPayload sin excluirlo) para permitir
// que un flujo administrativo edite el rol de un usuario existente.
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
