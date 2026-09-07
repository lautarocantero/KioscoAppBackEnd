import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import { buildRes } from '../../test/controllerTestUtils';
import { SellerModel } from '../../models/sellerModel';
import { KioscoModel } from '../../models/kioscoModel';
import {
    editSeller,
    getSellerByEmail,
    getSellerById,
    getSellerByName,
    getSellers,
    home,
} from '../seller.controller';

vi.mock('../../models/sellerModel', () => ({
    SellerModel: { edit: vi.fn() },
}));

vi.mock('../../models/kioscoModel', () => ({
    KioscoModel: { getSellersOfKiosco: vi.fn(), getMembership: vi.fn() },
}));

const mockedSellerModel = vi.mocked(SellerModel);
const mockedKioscoModel = vi.mocked(KioscoModel);

const sellers = [
    { _id: 's1', name: 'Ana Lopez', profilePhoto: null, email: 'ana@a.com', role: 'admin', user_status: 'online', created_at: '', joined_at: '' },
    { _id: 's2', name: 'Beto Ruiz', profilePhoto: null, email: 'beto@a.com', role: 'seller', user_status: 'offline', created_at: '', joined_at: '' },
] as never;

const buildReq = <T = Request>(overrides: Record<string, unknown> = {}): T =>
    ({ kioscoId: 'kiosco-1', params: {}, body: {}, query: {}, ...overrides }) as unknown as T;

describe('seller.controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('home', () => {
        it('devuelve 200 con el listado de endpoints en HTML', async () => {
            const res = buildRes();

            await home(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(expect.stringContaining('/edit-seller'));
        });
    });

    describe('getSellers', () => {
        it('devuelve los vendedores del kiosco activo', async () => {
            mockedKioscoModel.getSellersOfKiosco.mockResolvedValueOnce(sellers);
            const res = buildRes();

            await getSellers(buildReq(), res);

            expect(mockedKioscoModel.getSellersOfKiosco).toHaveBeenCalledWith('kiosco-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(sellers);
        });

        it('responde 400 si el modelo lanza un Error', async () => {
            mockedKioscoModel.getSellersOfKiosco.mockRejectedValueOnce(new Error('boom'));
            const res = buildRes();

            await getSellers(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getSellerById', () => {
        it('filtra por _id dentro de los vendedores del kiosco', async () => {
            mockedKioscoModel.getSellersOfKiosco.mockResolvedValueOnce(sellers);
            const res = buildRes();

            await getSellerById(buildReq({ query: { _id: 's2' } }), res);

            expect(res.json).toHaveBeenCalledWith([sellers[1]]);
        });

        it('devuelve un array vacío si no hay match', async () => {
            mockedKioscoModel.getSellersOfKiosco.mockResolvedValueOnce(sellers);
            const res = buildRes();

            await getSellerById(buildReq({ query: { _id: 'no-existe' } }), res);

            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    describe('getSellerByName', () => {
        it('busca coincidencias parciales sin importar mayúsculas', async () => {
            mockedKioscoModel.getSellersOfKiosco.mockResolvedValueOnce(sellers);
            const res = buildRes();

            await getSellerByName(buildReq({ body: { name: 'ana' } }), res);

            expect(res.json).toHaveBeenCalledWith([sellers[0]]);
        });
    });

    describe('getSellerByEmail', () => {
        it('devuelve el vendedor con ese email exacto', async () => {
            mockedKioscoModel.getSellersOfKiosco.mockResolvedValueOnce(sellers);
            const res = buildRes();

            await getSellerByEmail(buildReq({ body: { email: 'beto@a.com' } }), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(sellers[1]);
        });

        it('responde 400 si no hay ningún vendedor con ese email', async () => {
            mockedKioscoModel.getSellersOfKiosco.mockResolvedValueOnce(sellers);
            const res = buildRes();

            await getSellerByEmail(buildReq({ body: { email: 'nadie@a.com' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'There is not any seller with that email' });
        });
    });

    describe('editSeller', () => {
        it('edita el perfil si el vendedor pertenece al kiosco activo', async () => {
            mockedKioscoModel.getMembership.mockResolvedValueOnce({ _id: 'membership-1' } as never);
            mockedSellerModel.edit.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await editSeller(buildReq({ body: { _id: 's2', name: 'Beto R.' } }), res);

            expect(mockedKioscoModel.getMembership).toHaveBeenCalledWith('kiosco-1', 's2');
            expect(mockedSellerModel.edit).toHaveBeenCalledWith({ _id: 's2', name: 'Beto R.', profilePhoto: undefined, user_status: undefined });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('rechaza editar a alguien que no pertenece al kiosco activo', async () => {
            mockedKioscoModel.getMembership.mockResolvedValueOnce(null);
            const res = buildRes();

            await editSeller(buildReq({ body: { _id: 'intruso' } }), res);

            expect(mockedSellerModel.edit).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'This user is not a member of the kiosco' });
        });
    });
});
