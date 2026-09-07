import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PresentationModel } from '../presentationModel';
import { PresentationMongo } from '../../schemas/presentationSchema';
import { CatalogService } from '../../services/catalogService';
import { PlanService } from '../../services/planService';
import { KioscoPlanEnum } from '../../typings/membership/enums';
import { ModelType, ModelUnit } from '../../typings/presentation/presentationEnum';

vi.mock('../../schemas/presentationSchema', () => ({
    PresentationMongo: {
        find: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        findOneAndUpdate: vi.fn(),
        findOneAndDelete: vi.fn(),
    },
}));

vi.mock('../../services/catalogService', () => ({
    CatalogService: { getUnitCount: vi.fn() },
}));

vi.mock('../../services/planService', () => ({
    PlanService: { getKioscoOwnerPlan: vi.fn() },
}));

const mockedPresentationMongo = vi.mocked(PresentationMongo);
const mockedCatalogService = vi.mocked(CatalogService);
const mockedPlanService = vi.mocked(PlanService);

const lean = (value: unknown) => ({ lean: vi.fn().mockResolvedValue(value) });

const basePresentation = {
    product_id: 'prod-1', name: 'Coca 500ml', description: 'Gaseosa', sale_type: 'unit' as const,
    is_perishable: false, min_stock: 5, stock: 10, price: 1000,
    model_type: ModelType.Bottle, model_size: 500, model_unit: ModelUnit.Milliliters,
};

describe('PresentationModel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedPlanService.getKioscoOwnerPlan.mockResolvedValue(KioscoPlanEnum.Deluxe);
    });

    describe('getPresentations', () => {
        it('lista las presentaciones del kiosco', async () => {
            mockedPresentationMongo.find.mockReturnValueOnce(lean([{ _id: 'pres-1' }]) as never);

            const result = await PresentationModel.getPresentations('kiosco-1');

            expect(mockedPresentationMongo.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1' });
            expect(result).toEqual([{ _id: 'pres-1' }]);
        });
    });

    describe('getPresentationByField', () => {
        it('filtra por un campo string', async () => {
            mockedPresentationMongo.find.mockReturnValueOnce(lean([{ _id: 'pres-1' }]) as never);

            await PresentationModel.getPresentationByField('kiosco-1', 'name', 'Coca', 'string');

            expect(mockedPresentationMongo.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', name: 'Coca' });
        });

        it('lanza error si el tipo declarado no es soportado', async () => {
            await expect(PresentationModel.getPresentationByField('kiosco-1', 'name', 'x', 'boolean' as never))
                .rejects.toThrow('Unsupported field type for name');
        });
    });

    describe('getPresentationsByCategory', () => {
        it('filtra por categoría', async () => {
            mockedPresentationMongo.find.mockReturnValueOnce(lean([{ _id: 'pres-1' }]) as never);

            await PresentationModel.getPresentationsByCategory('kiosco-1', 'bebidas' as never);

            expect(mockedPresentationMongo.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', category: 'bebidas' });
        });
    });

    describe('searchByProductIdAndTerm', () => {
        it('busca por name/sku/model_type con regex case-insensitive', async () => {
            mockedPresentationMongo.find.mockReturnValueOnce(lean([{ _id: 'pres-1' }]) as never);

            await PresentationModel.searchByProductIdAndTerm('kiosco-1', 'prod-1', 'coca');

            expect(mockedPresentationMongo.find).toHaveBeenCalledWith({
                kiosco_id: 'kiosco-1',
                product_id: 'prod-1',
                $or: [
                    { name: { $regex: 'coca', $options: 'i' } },
                    { sku: { $regex: 'coca', $options: 'i' } },
                    { model_type: { $regex: 'coca', $options: 'i' } },
                ],
            });
        });
    });

    describe('getPresentationsWithStockByProductId', () => {
        it('filtra solo presentaciones con stock > 0', async () => {
            mockedPresentationMongo.find.mockReturnValueOnce(lean([{ _id: 'pres-1' }]) as never);

            await PresentationModel.getPresentationsWithStockByProductId('kiosco-1', 'prod-1');

            expect(mockedPresentationMongo.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1', product_id: 'prod-1', stock: { $gt: 0 } });
        });
    });

    describe('create', () => {
        it('crea la presentación cuando el dueño tiene un plan sin límite de catálogo (Deluxe)', async () => {
            mockedPresentationMongo.create.mockResolvedValueOnce(undefined as never);

            const _id = await PresentationModel.create('kiosco-1', basePresentation);

            expect(_id).toEqual(expect.any(String));
            expect(mockedCatalogService.getUnitCount).not.toHaveBeenCalled();
            expect(mockedPresentationMongo.create).toHaveBeenCalledWith(expect.objectContaining({ kiosco_id: 'kiosco-1', status: 'available' }));
        });

        it('crea la presentación cuando el catálogo tiene cupo bajo un plan con límite (Standard)', async () => {
            mockedPlanService.getKioscoOwnerPlan.mockResolvedValueOnce(KioscoPlanEnum.Standard);
            mockedCatalogService.getUnitCount.mockResolvedValueOnce(5);
            mockedPresentationMongo.create.mockResolvedValueOnce(undefined as never);

            await PresentationModel.create('kiosco-1', basePresentation);

            expect(mockedPresentationMongo.create).toHaveBeenCalled();
        });

        it('marca status out_of_stock si el stock inicial es 0', async () => {
            mockedPresentationMongo.create.mockResolvedValueOnce(undefined as never);

            await PresentationModel.create('kiosco-1', { ...basePresentation, stock: 0 });

            expect(mockedPresentationMongo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'out_of_stock' }));
        });

        it('lanza error si el kiosco alcanzó el límite de catálogo de su plan', async () => {
            mockedPlanService.getKioscoOwnerPlan.mockResolvedValueOnce(KioscoPlanEnum.Standard);
            mockedCatalogService.getUnitCount.mockResolvedValueOnce(1150);

            await expect(PresentationModel.create('kiosco-1', basePresentation))
                .rejects.toThrow('This kiosco reached its plan catalog limit (products + presentations)');
            expect(mockedPresentationMongo.create).not.toHaveBeenCalled();
        });

        it('exige expiration_date si is_perishable es true', async () => {
            await expect(PresentationModel.create('kiosco-1', { ...basePresentation, is_perishable: true }))
                .rejects.toThrow('No expiration_date provided');
        });
    });

    describe('decreaseStock', () => {
        it('descuenta stock y marca out_of_stock si llega a 0', async () => {
            mockedPresentationMongo.findOne.mockReturnValueOnce(lean({ stock: 5, sale_type: 'unit' }) as never);
            mockedPresentationMongo.findOneAndUpdate.mockReturnValueOnce(lean({ product_id: 'prod-1', name: 'Coca', stock: 0, min_stock: 5 }) as never);

            const result = await PresentationModel.decreaseStock('kiosco-1', [{ _id: 'pres-1', stock_required: 5 }]);

            expect(mockedPresentationMongo.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'pres-1', kiosco_id: 'kiosco-1' },
                { $set: expect.objectContaining({ stock: 0, status: 'out_of_stock' }) },
                { new: true, runValidators: true },
            );
            expect(result).toEqual([{ _id: 'pres-1', product_id: 'prod-1', name: 'Coca', stock: 0, min_stock: 5 }]);
        });

        it('también actualiza model_size para presentaciones por peso', async () => {
            mockedPresentationMongo.findOne.mockReturnValueOnce(lean({ stock: 1000, sale_type: 'weight' }) as never);
            mockedPresentationMongo.findOneAndUpdate.mockReturnValueOnce(lean({ product_id: 'prod-1', name: 'Jamón', stock: 700, min_stock: 100 }) as never);

            await PresentationModel.decreaseStock('kiosco-1', [{ _id: 'pres-1', stock_required: 300 }]);

            expect(mockedPresentationMongo.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'pres-1', kiosco_id: 'kiosco-1' },
                { $set: expect.objectContaining({ stock: 700, model_size: 700 }) },
                { new: true, runValidators: true },
            );
        });

        it('lanza error si la presentación no existe', async () => {
            mockedPresentationMongo.findOne.mockReturnValueOnce(lean(null) as never);

            await expect(PresentationModel.decreaseStock('kiosco-1', [{ _id: 'pres-1', stock_required: 1 }]))
                .rejects.toThrow('No existe presentación con id pres-1');
        });

        it('lanza error si el stock es insuficiente (chequeo no atómico, ver docs/tasks.md)', async () => {
            mockedPresentationMongo.findOne.mockReturnValueOnce(lean({ stock: 2, sale_type: 'unit' }) as never);

            await expect(PresentationModel.decreaseStock('kiosco-1', [{ _id: 'pres-1', stock_required: 5 }]))
                .rejects.toThrow('Stock insuficiente para la presentación pres-1');
            expect(mockedPresentationMongo.findOneAndUpdate).not.toHaveBeenCalled();
        });

        it('procesa varios ítems en orden, uno por uno', async () => {
            mockedPresentationMongo.findOne
                .mockReturnValueOnce(lean({ stock: 5, sale_type: 'unit' }) as never)
                .mockReturnValueOnce(lean({ stock: 3, sale_type: 'unit' }) as never);
            mockedPresentationMongo.findOneAndUpdate
                .mockReturnValueOnce(lean({ product_id: 'prod-1', name: 'A', stock: 4, min_stock: 1 }) as never)
                .mockReturnValueOnce(lean({ product_id: 'prod-2', name: 'B', stock: 1, min_stock: 1 }) as never);

            const result = await PresentationModel.decreaseStock('kiosco-1', [
                { _id: 'pres-1', stock_required: 1 },
                { _id: 'pres-2', stock_required: 2 },
            ]);

            expect(result).toHaveLength(2);
        });
    });

    describe('delete', () => {
        it('elimina la presentación del kiosco', async () => {
            mockedPresentationMongo.findOneAndDelete.mockResolvedValueOnce({ _id: 'pres-1' } as never);

            await PresentationModel.delete('kiosco-1', { _id: 'pres-1' });

            expect(mockedPresentationMongo.findOneAndDelete).toHaveBeenCalledWith({ _id: 'pres-1', kiosco_id: 'kiosco-1' });
        });

        it('lanza error si no existe', async () => {
            mockedPresentationMongo.findOneAndDelete.mockResolvedValueOnce(null as never);

            await expect(PresentationModel.delete('kiosco-1', { _id: 'pres-1' })).rejects.toThrow('There is not any presentation with that id');
        });
    });

    describe('edit', () => {
        const editPayload = {
            _id: 'pres-1', price: 1200, stock: 8, min_stock: 3,
            model_type: ModelType.Bottle, model_size: 500, model_unit: ModelUnit.Milliliters,
            is_perishable: false, name: 'Coca 500ml', description: 'Gaseosa',
            sale_type: 'unit' as const,
        };

        it('edita una presentación por unidad', async () => {
            mockedPresentationMongo.findOneAndUpdate.mockResolvedValueOnce({ _id: 'pres-1' } as never);

            await PresentationModel.edit('kiosco-1', editPayload);

            expect(mockedPresentationMongo.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'pres-1', kiosco_id: 'kiosco-1' },
                { $set: expect.objectContaining({ price: 1200, stock: 8, model_type: ModelType.Bottle, model_unit: 'ml' }) },
                { new: true, runValidators: true, context: 'query' },
            );
        });

        it('para venta por peso ignora model_type/model_unit', async () => {
            mockedPresentationMongo.findOneAndUpdate.mockResolvedValueOnce({ _id: 'pres-1' } as never);

            await PresentationModel.edit('kiosco-1', { ...editPayload, sale_type: 'weight' as never, model_size: 700 });

            expect(mockedPresentationMongo.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'pres-1', kiosco_id: 'kiosco-1' },
                { $set: expect.objectContaining({ model_type: undefined, model_unit: undefined, model_size: 700, sale_type: 'weight' }) },
                { new: true, runValidators: true, context: 'query' },
            );
        });

        it('lanza error si falta model_unit en una venta por unidad', async () => {
            await expect(PresentationModel.edit('kiosco-1', { ...editPayload, model_unit: undefined }))
                .rejects.toThrow('model_unit es requerido');
        });

        it('lanza error si no existe la presentación', async () => {
            mockedPresentationMongo.findOneAndUpdate.mockResolvedValueOnce(null as never);

            await expect(PresentationModel.edit('kiosco-1', editPayload)).rejects.toThrow('There is not any presentation with that id');
        });
    });
});
