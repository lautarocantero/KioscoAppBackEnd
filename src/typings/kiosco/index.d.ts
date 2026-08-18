
/*──────────────────────────────
📘 KioscoTypes
──────────────────────────────
📜 Propósito:
Definir tipados base y derivados para kioscos (el tenant/negocio al que
pertenecen productos, presentaciones, proveedores, ventas y vendedores).

🧩 Derivaciones:
- KioscoEntity → Kiosco → KioscoSchemaType
- KioscoEntity → KioscoPayloadUnknown → KioscoPayload
- KioscoPayload → Payloads específicos (Create, Join, Edit)
- Payloads → Requests tipados para controladores

🌀 Flujo estándar:
[Request] → [Payload] → [Model] → [Mongo] → [Response]
──────────────────────────────*/

import { AuthRoleEnum } from '@typings/auth/enums';

declare module '@typings/kiosco' {

/*══════════════════════════════════════════════════════════════════════╗
║ 🔒 BASE PRINCIPAL 🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

interface KioscoEntity {
    _id:          string;
    name:         string;
    address:      string;
    owner_id:     string;
    invite_code:  string;
    currency:     string;
    created_at:   string;
    updated_at:   string;
}

type KioscoPayloadUnknown = Record<keyof KioscoEntity, unknown>;

type KioscoParams = {
  kiosco_id?: string;
};

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS 🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩                ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type Kiosco = KioscoEntity;

export type KioscoPublic = KioscoEntity;

export type KioscoPayload = KioscoPayloadUnknown;

export type KioscoSchemaType = Kiosco;

// Kiosco + el rol del usuario autenticado dentro de ese kiosco (resuelto por join contra KioscoMembership)
export type KioscoWithRole = Kiosco & { role: AuthRoleEnum };

// KioscoWithRole + estadísticas calculadas para la card del selector
export type KioscoWithStats = KioscoWithRole & {
  sellers_count: number;
  sells_today_total: number;
  last_accessed_at: string | null;
};

export type InviteInfo = {
  invite_code: string;
  invite_link: string;
};

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type CreateKioscoPayload = {
  name: unknown;
  address: unknown;
  owner_id: string;
};

export type JoinKioscoPayload = {
  invite_code: unknown;
  user_id: string;
};

export type EditKioscoPayload = {
  kiosco_id: unknown;
  name?: unknown;
  address?: unknown;
  currency?: unknown;
};

export type GetInviteInfoPayload = {
  kiosco_id: unknown;
};

export type SelectKioscoPayload = {
  kiosco_id: unknown;
  user_id: string;
};

export type GetMyKioscosPayload = {
  user_id: string;
};

/*══════════════════════════════════════════════════════════════════════╗
║ 🔗 REQUEST 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type CreateKioscoRequest = Request<KioscoParams, unknown, Omit<CreateKioscoPayload, 'owner_id'>>;

export type JoinKioscoRequest = Request<KioscoParams, unknown, Omit<JoinKioscoPayload, 'user_id'>>;

export type MyKioscosRequest = Request<KioscoParams>;

export type InviteInfoRequest = Request<KioscoParams>;

export type EditKioscoRequest = Request<KioscoParams, unknown, Omit<EditKioscoPayload, 'kiosco_id'>>;

export type SelectKioscoRequest = Request<KioscoParams>;

}
