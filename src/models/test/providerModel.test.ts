import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderModel } from '../providerModel';
import { ProviderSchema } from '../../schemas/providerSchema';

vi.mock('../../schemas/providerSchema', () => ({
    ProviderSchema: {
        find: vi.fn(),
        findOne: vi.fn(),
        findOneAndDelete: vi.fn(),
        findOneAndUpdate: vi.fn(),
        create: vi.fn(),
        countDocuments: vi.fn(),
    },
}));

const mockedProviderSchema = vi.mocked(ProviderSchema);

const lean = (value: unknown) => ({ lean: vi.fn().mockResolvedValue(value) });
const limitedLean = (value: unknown) => ({ limit: vi.fn().mockReturnValue(lean(value)) });

describe('ProviderModel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getProviders', () => {
        it('lista hasta 100 proveedores del kiosco', async () => {
            mockedProviderSchema.find.mockReturnValueOnce(limitedLean([{ _id: 'prov-1' }]) as never);

            const result = await ProviderModel.getProviders('kiosco-1');

            expect(mockedProviderSchema.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1' });
            expect(result).toEqual([{ _id: 'prov-1' }]);
        });
    });

    describe('getProviderByField', () => {
        it('filtra por un campo string', async () => {
            mockedProviderSchema.find.mockReturnValueOnce(lean([{ _id: 'prov-1', name: 'Coca-Cola' }]) as never);

            const result = await ProviderModel.getProviderByField('kiosco-1', 'name', 'Coca-Cola', 'string');

            expect(mockedProviderSchema.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', name: 'Coca-Cola' });
            expect(result).toEqual([{ _id: 'prov-1', name: 'Coca-Cola' }]);
        });

        it('filtra por un campo number', async () => {
            mockedProviderSchema.find.mockReturnValueOnce(lean([{ _id: 'prov-1', valoration: 5 }]) as never);

            await ProviderModel.getProviderByField('kiosco-1', 'valoration', 5, 'number');

            expect(mockedProviderSchema.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', valoration: 5 });
        });

        it('lanza error si el tipo declarado no es soportado', async () => {
            await expect(ProviderModel.getProviderByField('kiosco-1', 'name', 'x', 'boolean' as never))
                .rejects.toThrow('Unsupported field type for name');
        });

        it('valida el valor según el tipo (string vacío rechazado)', async () => {
            await expect(ProviderModel.getProviderByField('kiosco-1', 'name', '', 'string'))
                .rejects.toThrow();
            expect(mockedProviderSchema.find).not.toHaveBeenCalled();
        });
    });

    describe('getProvidersByContact', () => {
        it('busca por teléfono o email de contacto', async () => {
            mockedProviderSchema.find.mockReturnValueOnce(lean([{ _id: 'prov-1' }]) as never);

            await ProviderModel.getProvidersByContact('kiosco-1', '11-2345-6789');

            expect(mockedProviderSchema.find).toHaveBeenCalledWith({
                kiosco_id: 'kiosco-1',
                $or: [{ contact_phone: '11-2345-6789' }, { contact_email: '11-2345-6789' }],
            });
        });
    });

    describe('getProvidersCount', () => {
        it('devuelve el total de proveedores del kiosco', async () => {
            mockedProviderSchema.countDocuments.mockResolvedValueOnce(7);

            const result = await ProviderModel.getProvidersCount('kiosco-1');

            expect(mockedProviderSchema.countDocuments).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1' });
            expect(result).toBe(7);
        });
    });

    describe('create', () => {
        const payload = { name: 'Coca-Cola', valoration: 5, contact_phone: '1123456789', contact_email: 'ventas@coca.com' };

        it('crea el proveedor si no existe otro con el mismo nombre en el kiosco', async () => {
            mockedProviderSchema.findOne.mockReturnValueOnce(lean(null) as never);
            mockedProviderSchema.create.mockResolvedValueOnce(undefined as never);

            const _id = await ProviderModel.create('kiosco-1', payload);

            expect(_id).toEqual(expect.any(String));
            expect(mockedProviderSchema.create).toHaveBeenCalledWith(expect.objectContaining({ kiosco_id: 'kiosco-1', name: 'Coca-Cola' }));
        });

        it('lanza error si ya existe un proveedor con ese nombre', async () => {
            mockedProviderSchema.findOne.mockReturnValueOnce(lean({ _id: 'existing' }) as never);

            await expect(ProviderModel.create('kiosco-1', payload)).rejects.toThrow('provider already exists');
            expect(mockedProviderSchema.create).not.toHaveBeenCalled();
        });

        it('lanza error si la valoración está fuera de rango', async () => {
            await expect(ProviderModel.create('kiosco-1', { ...payload, valoration: 6 })).rejects.toThrow('valoration must be between 1 and 5');
        });

        it('lanza error si el email de contacto es inválido', async () => {
            await expect(ProviderModel.create('kiosco-1', { ...payload, contact_email: 'no-es-email' })).rejects.toThrow('email has an invalid format');
        });
    });

    describe('delete', () => {
        it('elimina el proveedor del kiosco', async () => {
            mockedProviderSchema.findOneAndDelete.mockResolvedValueOnce({ _id: 'prov-1' } as never);

            await ProviderModel.delete('kiosco-1', { _id: 'prov-1' });

            expect(mockedProviderSchema.findOneAndDelete).toHaveBeenCalledWith({ _id: 'prov-1', kiosco_id: 'kiosco-1' });
        });

        it('lanza error si no existe', async () => {
            mockedProviderSchema.findOneAndDelete.mockResolvedValueOnce(null as never);

            await expect(ProviderModel.delete('kiosco-1', { _id: 'prov-1' })).rejects.toThrow('There is not any provider with that id');
        });
    });

    describe('edit', () => {
        it('actualiza solo los campos provistos', async () => {
            mockedProviderSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'prov-1' } as never);

            await ProviderModel.edit('kiosco-1', { _id: 'prov-1', name: 'Nuevo nombre' });

            expect(mockedProviderSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'prov-1', kiosco_id: 'kiosco-1' },
                { $set: { name: 'Nuevo nombre' } },
            );
        });

        it('lanza error si no existe', async () => {
            mockedProviderSchema.findOneAndUpdate.mockResolvedValueOnce(null as never);

            await expect(ProviderModel.edit('kiosco-1', { _id: 'prov-1', name: 'Nuevo' })).rejects.toThrow('There is not any provider with that id');
        });
    });
});
