// TO DO fijarme que no estoy usando los tipos adecuadamente
// no deberia usar DocumentAuth, deberia usar alguna interfaz que herede de esta
/*══════════════════════════════════════════════════════════════════════╗
║ 🧱 BASES 🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export interface DocumentAuth {
  _id: string;
  email: string;
  username: string;
  password: string;
  repeatPassword: string;
  authToken: string;
  refreshToken: string;
}                     

type AuthBaseType = DocumentAuth<T>; //Base de todos los tipos
export type AuthInfo = Omit<AuthBaseType, 'save'> // Sin metodos
export type AuthPublic = Omit<AuthBaseType, 'save' | 'password'>  // datos publicos, sin metodos

export type AuthRegister = Pick<AuthBaseType, 'username' | 'email' | 'password' | 'repeatPassword'>
export type AuthLogin = Pick<AuthBaseType, 'email' | 'password'>

export type AuthLogout = {
  cookies: {
    refresh_token: string;
  };
};

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ChechAuthType = Pick<DocumentAuth, '_id'>

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type AuthRegisterRequest = Request<AuthParams, unknown, AuthRegister>;

export type AuthLoginRequest = Request<AuthParams, unknown, AuthLogin>;

export type AuthLogoutRequest = Request<AuthParams, unknown, AuthLogout>;

export type AuthCheckAuthRequest = AuthLogoutRequest;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type AuthSchemaType = DocumentAuth;

/*══════════════════════════════════════════════════════════════════════╗
║ 🪙 TOKEN 🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙🪙                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export interface AuthTokenInterface {
    userId: string,
    token: string,
}

export type  AuthRefreshTokenType = Pick<AuthTokenInterface, 'userId'>

export type AuthTokenPublic = Pick<AuthPublic, 'refreshToken'>

