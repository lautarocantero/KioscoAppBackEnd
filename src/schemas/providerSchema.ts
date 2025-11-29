import DBLocal from "db-local";
import { ProviderSchemaType } from "../typings/provider/providerTypes";

const { Schema } = new DBLocal({ path: './db' });

export const ProviderSchema = Schema<ProviderSchemaType>('Provider', {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    valoration: { type: Number, required: false },
    contact_phone: { type: String, required: true },
    contact_auxiliar: { type: String, required: false },
});