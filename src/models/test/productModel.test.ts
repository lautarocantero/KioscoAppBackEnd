import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductModel } from '../productModel';
import { ProductMongo } from '../../schemas/productSchema';
import { CatalogService } from '../../services/catalogService';
import { PlanService } from '../../services/planService';
import { KioscoPlanEnum } from '../../typings/membership/enums';

vi.mock('../../schemas/productSchema', () => ({
    ProductMongo: {
        find: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        findOneAndUpdate: vi.fn(),
        findOneAndDelete: vi.fn(),
        deleteMany: vi.fn(),
    },
}));

vi.mock('../../services/catalogService', () => ({
    CatalogService: { getUnitCount: vi.fn() },
}));

vi.mock('../../services/planService', () => ({
    PlanService: { getKioscoOwnerPlan: vi.fn() },
}));

const mockedProductMongo = vi.mocked(ProductMongo);
const mockedCatalogService = vi.mocked(CatalogService);
const mockedPlanService = vi.mocked(PlanService);

const lean = (value: unknown) => ({ lean: vi.fn().mockResolvedValue(value) });
const limitedLean = (value: unknown) => ({ limit: vi.fn().mockReturnValue(lean(value)) });

const validPayload = {
    name: 'Coca-Cola',
    description: 'Gaseosa',
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
    image_url: 'https://example.com/coca.png',
    brand: 'Coca-Cola Co.',
};

describe('ProductModel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedPlanService.getKioscoOwnerPlan.mockResolvedValue(KioscoPlanEnum.Deluxe);
    });

    describe('getProducts', () => {
        it('lista hasta 100 productos del kiosco', async () => {
            mockedProductMongo.find.mockReturnValueOnce(limitedLean([{ _id: 'prod-1' }]) as never);

            const result = await ProductModel.getProducts('kiosco-1');

            expect(mockedProductMongo.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1' });
            expect(result).toEqual([{ _id: 'prod-1' }]);
        });
    });

    describe('getProductByField', () => {
        it('rechaza un type no soportado', async () => {
            await expect(ProductModel.getProductByField('kiosco-1', 'name', 'x', 'boolean' as never)).rejects.toThrow('Unsupported field type for name');
        });

        it('valida un campo string y consulta scoped por kiosco', async () => {
            mockedProductMongo.find.mockReturnValueOnce(lean([{ _id: 'prod-1' }]) as never);

            const result = await ProductModel.getProductByField('kiosco-1', 'name', 'Coca-Cola', 'string');

            expect(mockedProductMongo.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', name: 'Coca-Cola' });
            expect(result).toEqual([{ _id: 'prod-1' }]);
        });

        it('rechaza un valor string vacío', async () => {
            await expect(ProductModel.getProductByField('kiosco-1', 'name', '', 'string')).rejects.toThrow();
        });
    });

    describe('searchByField', () => {
        it('busca por regex case-insensitive en name/brand', async () => {
            mockedProductMongo.find.mockReturnValueOnce(lean([{ _id: 'prod-1' }]) as never);

            await ProductModel.searchByField('kiosco-1', 'brand', 'coca');

            expect(mockedProductMongo.find).toHaveBeenCalledWith({
                kiosco_id: 'kiosco-1',
                brand: { $regex: 'coca', $options: 'i' },
            });
        });
    });

    describe('create', () => {
        it('rechaza si ya existe un producto con ese nombre en el kiosco', async () => {
            mockedProductMongo.findOne.mockReturnValueOnce(lean({ _id: 'existing' }) as never);

            await expect(ProductModel.create('kiosco-1', validPayload as never)).rejects.toThrow('product already exists');
            expect(mockedProductMongo.create).not.toHaveBeenCalled();
        });

        it('sin límite de plan (Deluxe): crea sin consultar CatalogService.getUnitCount', async () => {
            mockedProductMongo.findOne.mockReturnValueOnce(lean(null) as never);
            mockedProductMongo.create.mockResolvedValueOnce({} as never);

            const id = await ProductModel.create('kiosco-1', validPayload as never);

            expect(mockedCatalogService.getUnitCount).not.toHaveBeenCalled();
            expect(mockedProductMongo.create).toHaveBeenCalledWith(expect.objectContaining({
                _id: id, kiosco_id: 'kiosco-1', name: 'Coca-Cola',
            }));
            expect(typeof id).toBe('string');
        });

        it('plan con límite (Standard) alcanzado: rechaza sin crear', async () => {
            mockedPlanService.getKioscoOwnerPlan.mockResolvedValueOnce(KioscoPlanEnum.Standard);
            mockedProductMongo.findOne.mockReturnValueOnce(lean(null) as never);
            mockedCatalogService.getUnitCount.mockResolvedValueOnce(1150); // == maxCatalogUnits de Standard

            await expect(ProductModel.create('kiosco-1', validPayload as never))
                .rejects.toThrow('This kiosco reached its plan catalog limit (products + presentations)');
            expect(mockedProductMongo.create).not.toHaveBeenCalled();
        });

        it('plan con límite (Standard) con cupo disponible: crea normalmente', async () => {
            mockedPlanService.getKioscoOwnerPlan.mockResolvedValueOnce(KioscoPlanEnum.Standard);
            mockedProductMongo.findOne.mockReturnValueOnce(lean(null) as never);
            mockedCatalogService.getUnitCount.mockResolvedValueOnce(1149);
            mockedProductMongo.create.mockResolvedValueOnce({} as never);

            await ProductModel.create('kiosco-1', validPayload as never);

            expect(mockedProductMongo.create).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('rechaza si no existe un producto con ese id en el kiosco', async () => {
            mockedProductMongo.findOneAndDelete.mockResolvedValueOnce(null as never);

            await expect(ProductModel.delete('kiosco-1', { _id: 'prod-1' })).rejects.toThrow('There is not any product with that id');
            expect(mockedProductMongo.deleteMany).not.toHaveBeenCalled();
        });

        it('borra el producto y en cascada sus presentations (product_id)', async () => {
            mockedProductMongo.findOneAndDelete.mockResolvedValueOnce({ _id: 'prod-1' } as never);

            await ProductModel.delete('kiosco-1', { _id: 'prod-1' });

            expect(mockedProductMongo.findOneAndDelete).toHaveBeenCalledWith({ _id: 'prod-1', kiosco_id: 'kiosco-1' });
            expect(mockedProductMongo.deleteMany).toHaveBeenCalledWith({ product_id: 'prod-1' });
        });
    });

    describe('edit', () => {
        it('rechaza si no existe un producto con ese id en el kiosco', async () => {
            mockedProductMongo.findOneAndUpdate.mockResolvedValueOnce(null as never);

            await expect(ProductModel.edit('kiosco-1', { _id: 'prod-1', ...validPayload } as never))
                .rejects.toThrow('There is not any product with that id');
        });

        it('actualiza los campos editables, scoped por kiosco', async () => {
            mockedProductMongo.findOneAndUpdate.mockResolvedValueOnce({ _id: 'prod-1' } as never);

            await ProductModel.edit('kiosco-1', { _id: 'prod-1', ...validPayload } as never);

            expect(mockedProductMongo.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'prod-1', kiosco_id: 'kiosco-1' },
                { $set: expect.objectContaining({ name: 'Coca-Cola', brand: 'Coca-Cola Co.' }) },
                { new: true },
            );
        });
    });
});
