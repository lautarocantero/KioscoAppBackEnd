import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import { buildRes } from '../../test/controllerTestUtils';
import { ProviderModel } from '../../models/providerModel';
import {
    createProvider,
    deleteProvider,
    editProvider,
    getProviderById,
    getProviders,
    getProvidersByContact,
    getProvidersByName,
    getProvidersByValoration,
    getProvidersStats,
    home,
} from '../provider.controller';

vi.mock('../../models/providerModel', () => ({
    ProviderModel: {
        getProviders: vi.fn(),
        getProviderByField: vi.fn(),
        getProvidersByContact: vi.fn(),
        getProvidersCount: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        edit: vi.fn(),
    },
}));

const mockedProviderModel = vi.mocked(ProviderModel);

const buildReq = <T = Request>(overrides: Record<string, unknown> = {}): T =>
    ({ kioscoId: 'kiosco-1', params: {}, body: {}, query: {}, ...overrides }) as unknown as T;

describe('provider.controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('home', () => {
        it('devuelve 200 con el listado de endpoints en HTML', async () => {
            const res = buildRes();

            await home(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(expect.stringContaining('/create-provider'));
        });
    });

    describe('getProviders', () => {
        it('devuelve los proveedores del kiosco activo', async () => {
            mockedProviderModel.getProviders.mockResolvedValueOnce([{ _id: 'p1' }] as never);
            const res = buildRes();

            await getProviders(buildReq(), res);

            expect(mockedProviderModel.getProviders).toHaveBeenCalledWith('kiosco-1');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si el modelo lanza un Error', async () => {
            mockedProviderModel.getProviders.mockRejectedValueOnce(new Error('boom'));
            const res = buildRes();

            await getProviders(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getProviderById', () => {
        it('filtra por _id', async () => {
            mockedProviderModel.getProviderByField.mockResolvedValueOnce([{ _id: 'p1' }] as never);
            const res = buildRes();

            await getProviderById(buildReq({ query: { _id: 'p1' } }), res);

            expect(mockedProviderModel.getProviderByField).toHaveBeenCalledWith('kiosco-1', '_id', 'p1', 'string');
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getProvidersByName', () => {
        it('filtra por name', async () => {
            mockedProviderModel.getProviderByField.mockResolvedValueOnce([{ _id: 'p1' }] as never);
            const res = buildRes();

            await getProvidersByName(buildReq({ query: { name: 'Coca' } }), res);

            expect(mockedProviderModel.getProviderByField).toHaveBeenCalledWith('kiosco-1', 'name', 'Coca', 'string');
        });
    });

    describe('getProvidersByValoration', () => {
        it('convierte la valoración de query string a number', async () => {
            mockedProviderModel.getProviderByField.mockResolvedValueOnce([{ _id: 'p1' }] as never);
            const res = buildRes();

            await getProvidersByValoration(buildReq({ query: { valoration: '5' } }), res);

            expect(mockedProviderModel.getProviderByField).toHaveBeenCalledWith('kiosco-1', 'valoration', 5, 'number');
        });

        it('pasa undefined si no viene la query', async () => {
            mockedProviderModel.getProviderByField.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getProvidersByValoration(buildReq({ query: {} }), res);

            expect(mockedProviderModel.getProviderByField).toHaveBeenCalledWith('kiosco-1', 'valoration', undefined, 'number');
        });
    });

    describe('getProvidersByContact', () => {
        it('busca por teléfono o email', async () => {
            mockedProviderModel.getProvidersByContact.mockResolvedValueOnce([{ _id: 'p1' }] as never);
            const res = buildRes();

            await getProvidersByContact(buildReq({ query: { contact: 'ventas@coca.com' } }), res);

            expect(mockedProviderModel.getProvidersByContact).toHaveBeenCalledWith('kiosco-1', 'ventas@coca.com');
        });
    });

    describe('getProvidersStats', () => {
        it('devuelve el total de proveedores', async () => {
            mockedProviderModel.getProvidersCount.mockResolvedValueOnce(7);
            const res = buildRes();

            await getProvidersStats(buildReq(), res);

            expect(res.json).toHaveBeenCalledWith({ totalProviders: 7 });
        });
    });

    describe('createProvider', () => {
        it('crea el proveedor y responde 200 con el id', async () => {
            mockedProviderModel.create.mockResolvedValueOnce('p1');
            const res = buildRes();

            await createProvider(buildReq({ body: { name: 'Coca', valoration: 5, contact_phone: '123', contact_email: 'a@a.com' } }), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ _id: 'p1', message: 'The provider has been registered correctly' });
        });

        it('responde 400 si el proveedor ya existe', async () => {
            mockedProviderModel.create.mockRejectedValueOnce(new Error('provider already exists'));
            const res = buildRes();

            await createProvider(buildReq({ body: { name: 'Coca' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('deleteProvider', () => {
        it('elimina el proveedor', async () => {
            mockedProviderModel.delete.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await deleteProvider(buildReq({ body: { _id: 'p1' } }), res);

            expect(mockedProviderModel.delete).toHaveBeenCalledWith('kiosco-1', { _id: 'p1' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si no existe', async () => {
            mockedProviderModel.delete.mockRejectedValueOnce(new Error('There is not any provider with that id'));
            const res = buildRes();

            await deleteProvider(buildReq({ body: { _id: 'p1' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('editProvider', () => {
        it('edita el proveedor', async () => {
            mockedProviderModel.edit.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await editProvider(buildReq({ body: { _id: 'p1', name: 'Nuevo' } }), res);

            expect(mockedProviderModel.edit).toHaveBeenCalledWith('kiosco-1', { _id: 'p1', name: 'Nuevo', valoration: undefined, contact_phone: undefined, contact_email: undefined });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
