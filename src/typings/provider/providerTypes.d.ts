
/*══════════════════════════════════════════════════════════════════════╗
║ 🔒 BASE PRINCIPAL 🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

// base
interface ProviderEntity {
    _id: string;
    name: string;
    valoration: number;
    contact_phone: string;
    contact_auxiliar: string;
}

//base con las funciones de db-local
interface ProviderRepository extends ProviderEntity {
  find(query: Partial<ProviderEntity>): Promise<ProviderEntity[]>;
  findOne(query: Partial<ProviderEntity>): Promise<ProviderEntity | null>;
  save(query?: Partial<ProviderEntity>, data?: Partial<ProviderEntity>): Promise<void>;
  remove(query?: Partial<ProviderEntity>): Promise<void>;
}

//base para payloads
type ProviderPayloadUnknown = Record<keyof ProviderEntity, unknown>;

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS 🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩                ║
╚══════════════════════════════════════════════════════════════════════╝*/

// derivado para no utilizar directamente el ProviderEntity
export type Provider = ProviderEntity;

// derivado para los datos publicos
export type ProviderPublic = Omit<ProviderEntity ,''>;

//derivado para acceder a los metodos de Provider 
export type ProviderModelType = ProviderRepository;

//derivado para data de payloads y posterior validacion
export type ProviderPayload = ProviderPayloadUnknown;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProviderSchemaType = Provider;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetProviderByIdPayload = Pick<ProviderPayload, '_id'>;

export type GetProviderByNamePayload = Pick<ProviderPayload, 'name'>;

export type GetProviderByValorationPayload = Pick<ProviderPayload, 'valoration'>;

export type GetProviderByContactPayload = Pick<ProviderPayload, 'contact_phone', 'contact_auxiliar'>;

export type CreateProviderPayload = Omit<ProviderPayload, '_id'>;

export type DeleteProviderPayload = Pick<ProviderPayload, '_id'>;

export type EditProviderPayload = ProviderPayload;

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetProviderByIdRequest = Request<SellParams, unknown, GetProviderByIdPayload>;

export type GetProviderByNameRequest = Request<SellParams, unknown, GetProviderByNamePayload>;

export type GetProviderByValorationRequest = Request<SellParams, unknown, GetProviderByValorationPayload>;

export type GetProviderByContactRequest = Request<SellParams, unknown, GetProviderByContactPayload>;

export type CreateProviderRequest = Request<SellParams, unknown, CreateProviderPayload>;

export type DeleteProviderRequest = Request<SellParams, unknown, DeleteProviderPayload>;

export type EditProviderRequest = Request<SellParams, unknown, EditProviderPayload>;
