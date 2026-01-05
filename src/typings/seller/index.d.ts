
/*──────────────────────────────
📘 SellerTypes
──────────────────────────────
📜 Propósito:
Definir tipados base y derivados para vendedores.  
Incluye entidad principal, repositorio local (db-local), payloads y requests.

🧩 Derivaciones:
- SellerEntity → Seller → SellerSchemaType
- SellerEntity → SellerRepository → SellerModelType
- SellerEntity → SellerPayloadUnknown → SellerPayload
- SellerPayload → Payloads específicos (Get, Create, Edit, Delete)
- Payloads → Requests tipados para controladores

🛡️ Seguridad:
- Usar SellerPublic para exponer datos sin campos sensibles (oculta `password`).
- Validar siempre los payloads antes de persistir o responder.

🌀 Flujo estándar:
[Request] → [Payload] → [Repository] → [DB Local/SQL] → [Response]
──────────────────────────────*/

import { SellerRol, SellerStatus } from "./sellerEnums";

declare module '@typings/seller' {

/*══════════════════════════════════════════════════════════════════════╗
║ 🔒 BASES PRIVADAS 🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒           ║
╚══════════════════════════════════════════════════════════════════════╝*/

//base 
interface SellerEntity {
    _id: string;
    name: string;
    email: string;
    password: string;
    rol: SellerRol;
    created_at: string;
    user_status: SellerStatus;
}

//base con las funciones de db-local
interface SellerRepository extends SellerEntity {
  find(query: Partial<SellerEntity>): Promise<SellerEntity[]>;
  findOne(query: Partial<SellerEntity>): Promise<SellerEntity | null>;
  save(query?: Partial<SellerEntity>, data?: Partial<SellerEntity>): Promise<void>;
  remove(query?: Partial<SellerEntity>): Promise<void>;
}

//base para payloads, no se de que dato seran, necesito validarlos.
type SellerPayloadUnknown = Record<keyof SellerEntity, unknown>;

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS PUBLICOS 🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩      ║
╚══════════════════════════════════════════════════════════════════════╝*/

// derivado para no utilizar directamente el SellerEntity
export type Seller = SellerEntity;

// derivado para los datos publicos
export type SellerPublic = Omit<SellerEntity, 'password'>

//derivado para acceder a los metodos de Seller
export type SellerModelType = SellerRepository;

//derivado para data de payloads y posterior validacion
export type SellerPayload = SellerPayloadUnknown;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type SellerSchemaType = Seller;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetSellerByIdPayload = Pick<SellerPayload, '_id' >;

export type GetSellerByNamePayload = Pick<SellerPayload, 'name' >;

export type GetSellerByEmailPayload = Pick<SellerPayload, 'email' >;

export type GetSellerByRolPayload = Pick<SellerPayload, 'rol' >;

export type CreateSellerPayload = Omit<SellerPayload, '_id' >;

export type DeleteSellerPayload = Pick<SellerPayload, '_id'>;

export type EditSellerPayload = SellerPayload;

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
export type GetSellerByIdRequest = Request<SellerParams, unknown, GetSellerByIdPayload>;

export type GetSellerByNameRequest = Request<SellerParams, unknown, GetSellerByNamePayload>;

export type GetSellerByEmailRequest = Request<SellerParams, unknown, GetSellerByEmailPayload>;

export type GetSellerByRolRequest = Request<SellerParams, unknown, GetSellerByRolPayload>;

export type CreateSellerRequest = Request<SellerParams, unknown, CreateSellerPayload>;

export type DeleteSellerRequest = Request<SellerParams, unknown, DeleteSellerPayload>;

export type EditSellerRequest = Request<SellerParams, unknown, EditSellerPayload>;

}