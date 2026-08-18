
/*──────────────────────────────
📘 KioscoMembershipTypes
──────────────────────────────
📜 Propósito:
Definir tipados para la relación N:N entre Auth (usuarios) y Kiosco: quién
pertenece a qué kiosco, con qué rol, y desde cuándo. El rol vive acá (no en
Auth) porque un mismo usuario puede ser admin en un kiosco y vendedor en otro.
──────────────────────────────*/

import { AuthRoleEnum } from '@typings/auth/enums';

declare module '@typings/kioscoMembership' {

/*══════════════════════════════════════════════════════════════════════╗
║ 🔒 BASE PRINCIPAL 🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

interface KioscoMembershipEntity {
    _id:               string;
    kiosco_id:         string;
    user_id:           string;
    role:              AuthRoleEnum;
    joined_at:         string;
    last_accessed_at:  string | null;
}

type KioscoMembershipPayloadUnknown = Record<keyof KioscoMembershipEntity, unknown>;

/*══════════════════════════════════════════════════════════════════════╗
║ 🧩 DERIVADOS 🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩🧩                ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type KioscoMembership = KioscoMembershipEntity;

export type KioscoMembershipPublic = KioscoMembershipEntity;

export type KioscoMembershipPayload = KioscoMembershipPayloadUnknown;

export type KioscoMembershipSchemaType = KioscoMembership;

// Vendedor de un kiosco: perfil (Seller) + email (Auth) + rol (KioscoMembership).
// created_at es la fecha de alta de la cuenta (Seller.created_at, global);
// joined_at es cuándo se sumó a ESTE kiosco en particular (puede ser distinto
// si la cuenta ya existía y se unió a un kiosco después).
export type KioscoSellerMember = {
  _id: string;
  name: string;
  profilePhoto: string | null;
  email: string;
  role: AuthRoleEnum;
  user_status: string;
  created_at: string;
  joined_at: string;
};

/*══════════════════════════════════════════════════════════════════════╗
║ 📦 PAYLOAD 📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦📦                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export type CreateKioscoMembershipPayload = {
  kiosco_id: string;
  user_id: string;
  role: AuthRoleEnum;
};

export type GetMembershipPayload = {
  kiosco_id: string;
  user_id: string;
};

}
