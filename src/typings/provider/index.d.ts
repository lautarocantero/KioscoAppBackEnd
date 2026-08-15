
/*──────────────────────────────
📘 ProviderTypes
──────────────────────────────
📜 Propósito:
Definir tipados base y derivados para proveedores.

🧩 Derivaciones:
- ProviderEntity → Provider → ProviderSchemaType
- ProviderEntity → ProviderPayloadUnknown → ProviderPayload
- ProviderPayload → Payloads específicos (Get, Create, Edit, Delete)
- Payloads → Requests tipados para controladores

🛡️ Seguridad:
- Validar siempre los payloads antes de persistir o responder.

🌀 Flujo estándar:
[Request] → [Payload] → [Model] → [Mongo] → [Response]
──────────────────────────────*/

declare module '@typings/provider' {

/*══════════════════════════════════════════════════════════════════════╗
║ 🔒 BASE PRINCIPAL 🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

interface ProviderEntity {
    _id:            string;
    name:           string;
    valoration:     number; // 1 a 5
    contact_phone:  string;
    contact_email:  string;
}

//base para payloads
type ProviderPayloadUnknown = Record<keyof ProviderEntity, unknown>;

type ProviderParams = {
  _id?: string;
};

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS 🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩                ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type Provider = ProviderEntity;

export type ProviderPublic = ProviderEntity;

export type ProviderPayload = ProviderPayloadUnknown;

/*══════════════════════════════════════════════════════════════════════╗
║ 🗂️ SCHEMA 🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️🗂️                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type ProviderSchemaType = Provider;

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

// Los GET de filtro van por query string (¬ body: los navegadores no mandan
// body en GET), así que estos payloads son siempre string | undefined.
export type GetProviderByIdQuery = { _id?: string };

export type GetProviderByNameQuery = { name?: string };

export type GetProviderByValorationQuery = { valoration?: string };

export type GetProviderByContactQuery = { contact?: string };

export type CreateProviderPayload = Omit<ProviderPayload, '_id'>;

export type DeleteProviderPayload = Pick<ProviderPayload, '_id'>;

// edit-provider: el modelo solo pisa los campos que vengan definidos.
export type EditProviderPayload =
    Pick<ProviderPayload, '_id'> & Partial<Omit<ProviderPayload, '_id'>>;

export type ProviderStats = {
  totalProviders: number;
};

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type GetProviderByIdRequest = Request<ProviderParams, unknown, unknown, GetProviderByIdQuery>;

export type GetProviderByNameRequest = Request<ProviderParams, unknown, unknown, GetProviderByNameQuery>;

export type GetProviderByValorationRequest = Request<ProviderParams, unknown, unknown, GetProviderByValorationQuery>;

export type GetProviderByContactRequest = Request<ProviderParams, unknown, unknown, GetProviderByContactQuery>;

export type CreateProviderRequest = Request<ProviderParams, unknown, CreateProviderPayload>;

export type DeleteProviderRequest = Request<ProviderParams, unknown, DeleteProviderPayload>;

export type EditProviderRequest = Request<ProviderParams, unknown, EditProviderPayload>;

}
