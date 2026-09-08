import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MongoBulkWriteError } from 'mongodb';
import { matchPresentations, applyReceiptDocs, confirmReceiptImport } from '../receiptImportService';
import { ProductMongo } from '../../../schemas/productSchema';
import { PresentationMongo } from '../../../schemas/presentationSchema';
import { PlanService } from '../../planService';
import { CatalogService } from '../../catalogService';
import { ReceiptDocAction } from '../../../typings/receipt/receiptEnum';
import { ModelType, ModelUnit } from '../../../typings/presentation/presentationEnum';
import { KioscoPlanEnum } from '../../../typings/membership/enums';

vi.mock('../../../schemas/productSchema', () => ({
    ProductMongo: { find: vi.fn(), insertMany: vi.fn() },
}));

vi.mock('../../../schemas/presentationSchema', () => ({
    PresentationMongo: { find: vi.fn(), insertMany: vi.fn(), bulkWrite: vi.fn() },
}));

vi.mock('../../planService', () => ({
    PlanService: { getKioscoOwnerPlan: vi.fn() },
}));

vi.mock('../../catalogService', () => ({
    CatalogService: { getUnitCount: vi.fn() },
}));

const mockedProductMongo = vi.mocked(ProductMongo);
const mockedPresentationMongo = vi.mocked(PresentationMongo);
const mockedPlanService = vi.mocked(PlanService);
const mockedCatalogService = vi.mocked(CatalogService);

const lean = (value: unknown) => ({ lean: vi.fn().mockResolvedValue(value) });

function fakeBulkWriteError(writeErrors: { index: number; errmsg: string }[]): MongoBulkWriteError {
    return new MongoBulkWriteError(
        { message: 'bulk write failed', code: 11000, writeErrors } as never,
        {} as never,
    );
}

function mkPresentation(overrides: Record<string, unknown> = {}) {
    return {
        _id: 'pres-1', kiosco_id: 'kiosco-1', product_id: 'prod-1', sku: 'SKU1', barcode: '',
        name: 'Coca 500ml', description: '', brand: '', model_type: ModelType.Bottle, model_size: 500,
        model_unit: ModelUnit.Milliliters, category: ['bebidas'], sale_type: 'unit', image_url: '',
        price: 100, stock: 10, min_stock: 2, status: 'available', created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z', is_perishable: false, expiration_date: '',
        ...overrides,
    };
}

function mkMatchedPresentation(overrides: Record<string, unknown> = {}) {
    return {
        ...mkPresentation(),
        action: ReceiptDocAction.Create,
        existingId: null,
        existingProductId: null,
        ...overrides,
    };
}

function mkProduct(overrides: Record<string, unknown> = {}) {
    return {
        _id: 'prod-1', kiosco_id: 'kiosco-1', name: 'Coca', description: 'Coca',
        created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
        image_url: '', brand: '', presentations: ['pres-1'],
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('matchPresentations', () => {
    it('sin ningún sku, no consulta la BD y todas quedan como create', async () => {
        const presentations = [mkPresentation({ sku: '' }), mkPresentation({ _id: 'pres-2', sku: '' })];

        const result = await matchPresentations(presentations as never, 'kiosco-1');

        expect(mockedPresentationMongo.find).not.toHaveBeenCalled();
        expect(result.every((p) => p.action === ReceiptDocAction.Create && p.existingId === null)).toBe(true);
    });

    it('presentation con sku que matchea en BD: action update, con existingId/existingProductId de la BD', async () => {
        mockedPresentationMongo.find.mockReturnValueOnce(lean([
            { _id: 'existing-pres-1', sku: 'SKU1', product_id: 'existing-prod-1' },
        ]) as never);
        const presentations = [mkPresentation({ sku: 'SKU1' })];

        const [result] = await matchPresentations(presentations as never, 'kiosco-1');

        expect(result.action).toBe(ReceiptDocAction.Update);
        expect(result.existingId).toBe('existing-pres-1');
        expect(result.existingProductId).toBe('existing-prod-1');
    });

    it('presentation con sku que no matchea en BD: action create', async () => {
        mockedPresentationMongo.find.mockReturnValueOnce(lean([]) as never);
        const presentations = [mkPresentation({ sku: 'SKU-NUEVO' })];

        const [result] = await matchPresentations(presentations as never, 'kiosco-1');

        expect(result.action).toBe(ReceiptDocAction.Create);
        expect(result.existingId).toBeNull();
    });

    it('consulta scoped por kiosco_id y solo con los skus no vacíos', async () => {
        mockedPresentationMongo.find.mockReturnValueOnce(lean([]) as never);
        const presentations = [mkPresentation({ sku: 'SKU1' }), mkPresentation({ _id: 'pres-2', sku: '' })];

        await matchPresentations(presentations as never, 'kiosco-1');

        expect(mockedPresentationMongo.find).toHaveBeenCalledWith(
            { kiosco_id: 'kiosco-1', sku: { $in: ['SKU1'] } },
            { _id: 1, sku: 1, product_id: 1 },
        );
    });
});

describe('applyReceiptDocs', () => {
    it('sin límite de plan (Deluxe): inserta products+presentations create sin recortar', async () => {
        mockedPlanService.getKioscoOwnerPlan.mockResolvedValueOnce(KioscoPlanEnum.Deluxe);
        mockedProductMongo.find.mockReturnValueOnce(lean([]) as never);
        mockedProductMongo.insertMany.mockResolvedValueOnce([] as never);
        mockedPresentationMongo.insertMany.mockResolvedValueOnce([] as never);

        const result = await applyReceiptDocs([mkProduct()] as never, [mkMatchedPresentation()] as never, 'kiosco-1');

        expect(mockedCatalogService.getUnitCount).not.toHaveBeenCalled();
        expect(result.skippedByPlanLimit).toBe(0);
        expect(result.products.inserted).toEqual(['prod-1']);
        expect(result.presentations.created).toEqual(['pres-1']);
    });

    it('plan con límite (Standard): recorta por grupo (producto + sus presentations nuevas) según headroom', async () => {
        mockedPlanService.getKioscoOwnerPlan.mockResolvedValueOnce(KioscoPlanEnum.Standard);
        mockedCatalogService.getUnitCount.mockResolvedValueOnce(1148); // maxCatalogUnits Standard = 1150 => headroom 2
        mockedProductMongo.find.mockReturnValueOnce(lean([]) as never);
        mockedProductMongo.insertMany.mockResolvedValueOnce([] as never);
        mockedPresentationMongo.insertMany.mockResolvedValueOnce([] as never);

        const products = [mkProduct({ _id: 'prod-1', presentations: ['pres-1'] }), mkProduct({ _id: 'prod-2', presentations: ['pres-2'] })];
        const presentations = [
            mkMatchedPresentation({ _id: 'pres-1', product_id: 'prod-1' }), // grupo 1: costo 2 (1 producto + 1 presentation)
            mkMatchedPresentation({ _id: 'pres-2', product_id: 'prod-2' }), // grupo 2: costo 2, no entra (headroom ya en 0)
        ];

        const result = await applyReceiptDocs(products as never, presentations as never, 'kiosco-1');

        expect(result.skippedByPlanLimit).toBe(2);
        expect(result.products.inserted).toEqual(['prod-1']);
        expect(result.presentations.created).toEqual(['pres-1']);
    });

    it('presentation create de un producto YA EXISTENTE (no viene en products) consume cupo de a 1, no de a grupo', async () => {
        mockedPlanService.getKioscoOwnerPlan.mockResolvedValueOnce(KioscoPlanEnum.Standard);
        mockedCatalogService.getUnitCount.mockResolvedValueOnce(1149); // headroom 1
        mockedPresentationMongo.insertMany.mockResolvedValueOnce([] as never);

        const presentations = [
            mkMatchedPresentation({ _id: 'pres-a', product_id: 'prod-existente' }),
            mkMatchedPresentation({ _id: 'pres-b', product_id: 'prod-existente' }),
        ];

        const result = await applyReceiptDocs([] as never, presentations as never, 'kiosco-1');

        expect(mockedProductMongo.find).not.toHaveBeenCalled();
        expect(mockedProductMongo.insertMany).not.toHaveBeenCalled();
        expect(result.skippedByPlanLimit).toBe(1);
        expect(result.presentations.created).toEqual(['pres-a']);
    });

    it('insertProducts: un producto cuyo _id ya existe en Mongo se saltea como duplicado', async () => {
        mockedPlanService.getKioscoOwnerPlan.mockResolvedValueOnce(KioscoPlanEnum.Deluxe);
        mockedProductMongo.find.mockReturnValueOnce(lean([{ _id: 'prod-dup' }]) as never);

        const result = await applyReceiptDocs([mkProduct({ _id: 'prod-dup', presentations: [] })] as never, [] as never, 'kiosco-1');

        expect(result.products.skippedDuplicates).toEqual(['prod-dup']);
        expect(result.products.inserted).toEqual([]);
        expect(mockedProductMongo.insertMany).not.toHaveBeenCalled();
    });

    it('insertProducts: un error de bulk insert marca el producto como failed y NO lo cuenta como inserted', async () => {
        mockedPlanService.getKioscoOwnerPlan.mockResolvedValueOnce(KioscoPlanEnum.Deluxe);
        mockedProductMongo.find.mockReturnValueOnce(lean([]) as never);
        mockedProductMongo.insertMany.mockRejectedValueOnce(fakeBulkWriteError([{ index: 0, errmsg: 'E11000 duplicate key' }]));

        const result = await applyReceiptDocs(
            [mkProduct({ _id: 'prod-fail', presentations: ['pres-1'] })] as never,
            [mkMatchedPresentation({ _id: 'pres-1', product_id: 'prod-fail' })] as never,
            'kiosco-1',
        );

        expect(result.products.failed).toEqual([{ _id: 'prod-fail', error: 'E11000 duplicate key' }]);
        expect(result.products.inserted).toEqual([]);
        // Nota de comportamiento actual (no arreglado acá, ver docs/tasks.md): las
        // presentations de un producto que falló al insertarse se descartan en
        // silencio — ni se crean, ni figuran como failed en presentationResult.
        expect(mockedPresentationMongo.insertMany).not.toHaveBeenCalled();
        expect(result.presentations.created).toEqual([]);
        expect(result.presentations.failed).toEqual([]);
    });

    it('update: una presentation sin cambios reales se saltea (unchanged) y no dispara bulkWrite', async () => {
        mockedPlanService.getKioscoOwnerPlan.mockResolvedValueOnce(KioscoPlanEnum.Deluxe);
        mockedPresentationMongo.find.mockReturnValueOnce(lean([{ ...mkPresentation(), _id: 'existing-1' }]) as never);

        const presentations = [mkMatchedPresentation({
            action: ReceiptDocAction.Update, existingId: 'existing-1', existingProductId: 'prod-1',
        })];

        const result = await applyReceiptDocs([] as never, presentations as never, 'kiosco-1');

        expect(result.presentations.unchanged).toEqual(['existing-1']);
        expect(result.presentations.updated).toEqual([]);
        expect(mockedPresentationMongo.bulkWrite).not.toHaveBeenCalled();
    });

    it('update: una presentation con cambios dispara bulkWrite (sin tocar product_id/created_at) y cuenta como updated', async () => {
        mockedPlanService.getKioscoOwnerPlan.mockResolvedValueOnce(KioscoPlanEnum.Deluxe);
        mockedPresentationMongo.find.mockReturnValueOnce(lean([{ _id: 'existing-1', ...mkPresentation({ price: 100 }) }]) as never);
        mockedPresentationMongo.bulkWrite.mockResolvedValueOnce({} as never);

        const presentations = [mkMatchedPresentation({
            action: ReceiptDocAction.Update, existingId: 'existing-1', existingProductId: 'prod-1', price: 200,
        })];

        const result = await applyReceiptDocs([] as never, presentations as never, 'kiosco-1');

        expect(result.presentations.updated).toEqual(['existing-1']);
        expect(mockedPresentationMongo.bulkWrite).toHaveBeenCalledTimes(1);
        const [ops] = mockedPresentationMongo.bulkWrite.mock.calls[0] as [{ updateOne: { filter: { _id: string }; update: { $set: Record<string, unknown> } } }[]];
        expect(ops[0].updateOne.filter).toEqual({ _id: 'existing-1' });
        expect(ops[0].updateOne.update.$set.price).toBe(200);
        expect(ops[0].updateOne.update.$set).not.toHaveProperty('product_id');
        expect(ops[0].updateOne.update.$set).not.toHaveProperty('created_at');
    });
});

describe('confirmReceiptImport', () => {
    it('delega en applyReceiptDocs con los mismos argumentos', async () => {
        mockedPlanService.getKioscoOwnerPlan.mockResolvedValueOnce(KioscoPlanEnum.Deluxe);
        mockedProductMongo.find.mockReturnValueOnce(lean([]) as never);
        mockedProductMongo.insertMany.mockResolvedValueOnce([] as never);
        mockedPresentationMongo.insertMany.mockResolvedValueOnce([] as never);

        const result = await confirmReceiptImport([mkProduct()] as never, [mkMatchedPresentation()] as never, 'kiosco-1');

        expect(result.products.inserted).toEqual(['prod-1']);
        expect(result.presentations.created).toEqual(['pres-1']);
    });
});
