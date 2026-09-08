import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatalogService } from '../catalogService';
import { ProductMongo } from '../../schemas/productSchema';
import { PresentationMongo } from '../../schemas/presentationSchema';

vi.mock('../../schemas/productSchema', () => ({
    ProductMongo: {
        aggregate: vi.fn(),
        countDocuments: vi.fn(),
    },
}));

vi.mock('../../schemas/presentationSchema', () => ({
    PresentationMongo: {
        countDocuments: vi.fn(),
    },
}));

const mockedProductMongo = vi.mocked(ProductMongo);
const mockedPresentationMongo = vi.mocked(PresentationMongo);

describe('CatalogService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getProductsWithPresentations', () => {
        it('agrega el $lookup de presentations y limita a 100, sin filtro de stock', async () => {
            mockedProductMongo.aggregate.mockResolvedValueOnce([{ _id: 'prod-1' }] as never);

            const result = await CatalogService.getProductsWithPresentations('kiosco-1');

            expect(result).toEqual([{ _id: 'prod-1' }]);
            const pipeline = mockedProductMongo.aggregate.mock.calls[0][0] as Record<string, unknown>[];
            expect(pipeline[0]).toEqual({ $match: { kiosco_id: 'kiosco-1' } });
            expect(pipeline[1]).toHaveProperty('$lookup');
            expect(pipeline).toContainEqual({ $limit: 100 });
            expect(pipeline).not.toContainEqual(expect.objectContaining({ $match: { 'presentations.stock': { $gt: 0 } } }));
        });
    });

    describe('getProductsWithStock', () => {
        it('agrega además el filtro de presentations.stock > 0', async () => {
            mockedProductMongo.aggregate.mockResolvedValueOnce([]);

            await CatalogService.getProductsWithStock('kiosco-1');

            const pipeline = mockedProductMongo.aggregate.mock.calls[0][0] as Record<string, unknown>[];
            expect(pipeline).toContainEqual({ $match: { 'presentations.stock': { $gt: 0 } } });
        });
    });

    describe('searchProductsWithPresentations', () => {
        it('rechaza si no viene ni term ni category', async () => {
            await expect(CatalogService.searchProductsWithPresentations('kiosco-1', '')).rejects.toThrow('Debe proveerse term o category');
            expect(mockedProductMongo.aggregate).not.toHaveBeenCalled();
        });

        it('rechaza una category que no está en PRESENTATION_CATEGORY_VALUES', async () => {
            await expect(CatalogService.searchProductsWithPresentations('kiosco-1', '', 'categoria-inventada'))
                .rejects.toThrow('Categoría inválida: categoria-inventada');
        });

        it('con solo term arma el $or por regex (no exact) y sin filtro de category', async () => {
            mockedProductMongo.aggregate.mockResolvedValueOnce([]);

            await CatalogService.searchProductsWithPresentations('kiosco-1', 'coca');

            const pipeline = mockedProductMongo.aggregate.mock.calls[0][0] as Record<string, unknown>[];
            const orMatch = pipeline.find((stage) => (stage.$match as Record<string, unknown>)?.$or) as { $match: { $or: unknown[] } };
            expect(orMatch.$match.$or).toHaveLength(6);
            expect(orMatch.$match.$or[0]).toEqual({ name: { $regex: 'coca', $options: 'i' } });
            expect(pipeline.some((stage) => (stage.$match as Record<string, unknown>)?.['presentations.category'])).toBe(false);
        });

        it('con exact=true ancla el regex con ^...$', async () => {
            mockedProductMongo.aggregate.mockResolvedValueOnce([]);

            await CatalogService.searchProductsWithPresentations('kiosco-1', 'coca', undefined, true);

            const pipeline = mockedProductMongo.aggregate.mock.calls[0][0] as Record<string, unknown>[];
            const orMatch = pipeline.find((stage) => (stage.$match as Record<string, unknown>)?.$or) as { $match: { $or: { name: { $regex: string } }[] } };
            expect(orMatch.$match.$or[0].name.$regex).toBe('^coca$');
        });

        it('escapa caracteres especiales de regex en el term', async () => {
            mockedProductMongo.aggregate.mockResolvedValueOnce([]);

            await CatalogService.searchProductsWithPresentations('kiosco-1', '3.2+2');

            const pipeline = mockedProductMongo.aggregate.mock.calls[0][0] as Record<string, unknown>[];
            const orMatch = pipeline.find((stage) => (stage.$match as Record<string, unknown>)?.$or) as { $match: { $or: { name: { $regex: string } }[] } };
            expect(orMatch.$match.$or[0].name.$regex).toBe('3\\.2\\+2');
        });

        it('con category válida agrega el $match de presentations.category', async () => {
            mockedProductMongo.aggregate.mockResolvedValueOnce([]);

            await CatalogService.searchProductsWithPresentations('kiosco-1', undefined as unknown as string, 'snacks');

            const pipeline = mockedProductMongo.aggregate.mock.calls[0][0] as Record<string, unknown>[];
            expect(pipeline).toContainEqual({ $match: { 'presentations.category': 'snacks' } });
        });
    });

    describe('getStats', () => {
        it('cuenta productos totales y presentations con stock < min_stock', async () => {
            mockedProductMongo.countDocuments.mockResolvedValueOnce(42 as never);
            mockedPresentationMongo.countDocuments.mockResolvedValueOnce(7 as never);

            const result = await CatalogService.getStats('kiosco-1');

            expect(result).toEqual({ totalProducts: 42, lowStockPresentations: 7 });
            expect(mockedPresentationMongo.countDocuments).toHaveBeenCalledWith({
                kiosco_id: 'kiosco-1',
                $expr: { $lt: ['$stock', '$min_stock'] },
            });
        });
    });

    describe('getUnitCount', () => {
        it('suma productos + presentations del kiosco', async () => {
            mockedProductMongo.countDocuments.mockResolvedValueOnce(10 as never);
            mockedPresentationMongo.countDocuments.mockResolvedValueOnce(15 as never);

            const result = await CatalogService.getUnitCount('kiosco-1');

            expect(result).toBe(25);
        });
    });
});
