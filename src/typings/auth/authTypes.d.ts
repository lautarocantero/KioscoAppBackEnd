import { DocumentAuth } from './auth/index';
//   ____                      
//  |  _ \                     
//  | |_) | __ _ ___  ___  ___ 
//  |  _ < / _` / __|/ _ \/ __|
//  | |_) | (_| \__ \  __/\__ \
//  |____/ \__,_|___/\___||___/
                            
/**
 * DocumentAuth es un Documento completo de autenticación.
 * Contiene métodos y datos sensibles.
 * - Métodos: save()
 * - Campos: username, password, refreshToken
 */

type AuthBaseType = DocumentAuth<T>; //Base de todos los tipos
export type AuthInfo = Omit<AuthBaseType, 'save'> // Sin metodos
export type AuthPublic = Omit<AuthBaseType, 'save' | 'password'>  // datos publicos, sin metodos


// export type RequestLogout = Pick<AuthPublic, '_id'>

/////////////////////////
// token
/////////////////////////


export interface AuthTokenInterface {
    userId: string,
    token: string,
}

export type AuthTokenPublic = Pick<AuthPublic, 'refreshToken'>

