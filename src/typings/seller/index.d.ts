import { SellerStatus } from "./sellerEnums";

declare module '@typings/seller' {

interface SellerEntity {
    _id: string; // == Auth._id
    name: string;
    profilePhoto: string | null;
    created_at: string;
    user_status: SellerStatus;
}

interface SellerRepository extends SellerEntity {
  find(query: Partial<SellerEntity>): Promise<SellerEntity[]>;
  findOne(query: Partial<SellerEntity>): Promise<SellerEntity | null>;
  save(query?: Partial<SellerEntity>, data?: Partial<SellerEntity>): Promise<void>;
  remove(query?: Partial<SellerEntity>): Promise<void>;
}

type SellerPayloadUnknown = Record<keyof SellerEntity, unknown>;

export type Seller = SellerEntity;

// Ya no oculta 'password': no existe en Seller
export type SellerPublic = SellerEntity;

// Solo para el endpoint getSellerByEmail, que resuelve el email contra Auth
export type SellerWithEmail = SellerEntity & { email: string };

export type SellerModelType = SellerRepository;
export type SellerPayload = SellerPayloadUnknown;
export type SellerSchemaType = Seller;

/*═══ PAYLOADS ═══*/

export type GetSellerByIdPayload = Pick<SellerPayload, '_id'>;
export type GetSellerByNamePayload = Pick<SellerPayload, 'name'>;
export type GetSellerByEmailPayload = { email: unknown }; // no es campo propio de Seller

// create/delete de Seller ya no existen como endpoints propios: los maneja AuthModel (register/deleteAuth)
export type EditSellerPayload = {
  _id: unknown;
  name?: unknown;
  profilePhoto?: unknown;
  user_status?: unknown;
};

/*═══ REQUESTS ═══*/

export type GetSellerByIdRequest = Request<SellerParams, unknown, GetSellerByIdPayload>;
export type GetSellerByNameRequest = Request<SellerParams, unknown, GetSellerByNamePayload>;
export type GetSellerByEmailRequest = Request<SellerParams, unknown, GetSellerByEmailPayload>;
export type EditSellerRequest = Request<SellerParams, unknown, EditSellerPayload>;

}