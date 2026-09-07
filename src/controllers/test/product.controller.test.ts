import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import type {
    CreateProductRequest,
    DeleteProductRequest,
    EditProductRequest,
    GetProductByBrandRequest,
    GetProductByIdRequest,
    GetProductByNameRequest,
} from '@typings/product';
import { buildRes } from '../../test/controllerTestUtils';
import { ProductModel } from '../../models/productModel';
import { CatalogService } from '../../services/catalogService';
import {
    createProduct,
    deleteProduct,
    editProduct,
    getProductByBrand,
    getProductById,
    getProductByName,
    getProducts,
    getProductsWithPresentations,
    getProductsWithStock,
    getProductStats,
    home,
    searchProductsWithPresentations,
} from '../product.controller';

vi.mock('../../models/productModel', () => ({
    ProductModel: {
        getProducts: vi.fn(),
        getProductByField: vi.fn(),
        searchByField: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        edit: vi.fn(),
    },
}));

vi.mock('../../services/catalogService', () => ({
    CatalogService: {
        getProductsWithStock: vi.fn(),
        getProductsWithPresentations: vi.fn(),
        searchProductsWithPresentations: vi.fn(),
        getStats: vi.fn(),
    },
}));

const mockedProductModel = vi.mocked(ProductModel);
const mockedCatalogService = vi.mocked(CatalogService);

const buildReq = <T = Request>(overrides: Record<string, unknown> = {}): T =>
    ({ kioscoId: 'kiosco-1', params: {}, body: {}, query: {}, ...overrides }) as unknown as T;

describe('product.controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('home', () => {
        it('devuelve 200 con el listado de endpoints', async () => {
            const res = buildRes();

            await home(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Estas en product'));
        });
    });

    describe('getProducts', () => {
        it('devuelve los productos del kiosco', async () => {
            mockedProductModel.getProducts.mockResolvedValueOnce([{ _id: '1' }] as never);
            const res = buildRes();

            await getProducts(buildReq(), res);

            expect(mockedProductModel.getProducts).toHaveBeenCalledWith('kiosco-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ _id: '1' }]);
        });

        it('responde 400 si el modelo lanza un Error', async () => {
            mockedProductModel.getProducts.mockRejectedValueOnce(new Error('boom'));
            const res = buildRes();

            await getProducts(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'boom' });
        });
    });

    describe('getProductById', () => {
        it('responde 400 si no viene _id', async () => {
            const res = buildRes();

            await getProductById(buildReq<GetProductByIdRequest>({ params: {} }), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockedProductModel.getProductByField).not.toHaveBeenCalled();
        });

        it('responde 404 si no se encuentra el producto', async () => {
            mockedProductModel.getProductByField.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getProductById(buildReq<GetProductByIdRequest>({ params: { _id: 'product-1' } }), res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('devuelve el producto encontrado', async () => {
            mockedProductModel.getProductByField.mockResolvedValueOnce([{ _id: 'product-1' }] as never);
            const res = buildRes();

            await getProductById(buildReq<GetProductByIdRequest>({ params: { _id: 'product-1' } }), res);

            expect(mockedProductModel.getProductByField).toHaveBeenCalledWith('kiosco-1', '_id', 'product-1', 'string');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ _id: 'product-1' });
        });
    });

    describe('getProductByName', () => {
        it('busca por nombre', async () => {
            mockedProductModel.searchByField.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getProductByName(buildReq<GetProductByNameRequest>({ query: { name: 'coca' } }), res);

            expect(mockedProductModel.searchByField).toHaveBeenCalledWith('kiosco-1', 'name', 'coca');
        });
    });

    describe('getProductByBrand', () => {
        it('busca por marca', async () => {
            mockedProductModel.getProductByField.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getProductByBrand(buildReq<GetProductByBrandRequest>({ query: { brand: 'coca-cola' } }), res);

            expect(mockedProductModel.getProductByField).toHaveBeenCalledWith('kiosco-1', 'brand', 'coca-cola', 'string');
        });
    });

    describe('getProductsWithStock', () => {
        it('delega en CatalogService', async () => {
            mockedCatalogService.getProductsWithStock.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getProductsWithStock(buildReq(), res);

            expect(mockedCatalogService.getProductsWithStock).toHaveBeenCalledWith('kiosco-1');
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getProductsWithPresentations', () => {
        it('delega en CatalogService', async () => {
            mockedCatalogService.getProductsWithPresentations.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await getProductsWithPresentations(buildReq(), res);

            expect(mockedCatalogService.getProductsWithPresentations).toHaveBeenCalledWith('kiosco-1');
        });
    });

    describe('searchProductsWithPresentations', () => {
        it('pasa term, category y exact al service', async () => {
            mockedCatalogService.searchProductsWithPresentations.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await searchProductsWithPresentations(
                buildReq({ query: { term: 'coca', category: 'bebidas', exact: 'true' } }),
                res
            );

            expect(mockedCatalogService.searchProductsWithPresentations).toHaveBeenCalledWith(
                'kiosco-1',
                'coca',
                'bebidas',
                true
            );
        });

        it('exact es false si no viene "true" literal', async () => {
            mockedCatalogService.searchProductsWithPresentations.mockResolvedValueOnce([] as never);
            const res = buildRes();

            await searchProductsWithPresentations(buildReq({ query: { term: 'coca' } }), res);

            expect(mockedCatalogService.searchProductsWithPresentations).toHaveBeenCalledWith(
                'kiosco-1',
                'coca',
                undefined,
                false
            );
        });
    });

    describe('getProductStats', () => {
        it('devuelve las estadísticas del catálogo', async () => {
            mockedCatalogService.getStats.mockResolvedValueOnce({ totalProducts: 10, lowStockProducts: 2 } as never);
            const res = buildRes();

            await getProductStats(buildReq(), res);

            expect(res.json).toHaveBeenCalledWith({ totalProducts: 10, lowStockProducts: 2 });
        });
    });

    describe('createProduct', () => {
        it('crea el producto y confirma', async () => {
            mockedProductModel.create.mockResolvedValueOnce('product-1' as never);
            const res = buildRes();

            await createProduct(
                buildReq<CreateProductRequest>({
                    body: { name: 'Coca', description: 'Gaseosa', created_at: '2026-01-01', updated_at: '2026-01-01', image_url: '', brand: 'Coca-Cola' },
                }),
                res
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ _id: 'product-1', message: 'Product created successfully' });
        });

        it('responde 400 si falla la creación', async () => {
            mockedProductModel.create.mockRejectedValueOnce(new Error('boom'));
            const res = buildRes();

            await createProduct(buildReq<CreateProductRequest>({ body: {} }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('deleteProduct', () => {
        it('elimina el producto y confirma', async () => {
            mockedProductModel.delete.mockResolvedValueOnce(undefined as never);
            const res = buildRes();

            await deleteProduct(buildReq<DeleteProductRequest>({ body: { _id: 'product-1' } }), res);

            expect(mockedProductModel.delete).toHaveBeenCalledWith('kiosco-1', { _id: 'product-1' });
            expect(res.json).toHaveBeenCalledWith({ _id: 'product-1', message: 'Product has been deleted successfully' });
        });

        it('responde 400 si falla el borrado', async () => {
            mockedProductModel.delete.mockRejectedValueOnce(new Error('boom'));
            const res = buildRes();

            await deleteProduct(buildReq<DeleteProductRequest>({ body: { _id: 'product-1' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('editProduct', () => {
        it('edita el producto y confirma', async () => {
            mockedProductModel.edit.mockResolvedValueOnce(undefined as never);
            const res = buildRes();

            await editProduct(buildReq<EditProductRequest>({ body: { _id: 'product-1', name: 'Coca Zero' } }), res);

            expect(mockedProductModel.edit).toHaveBeenCalledWith(
                'kiosco-1',
                expect.objectContaining({ _id: 'product-1', name: 'Coca Zero' })
            );
            expect(res.json).toHaveBeenCalledWith({ _id: 'product-1', message: 'Product has been edited successfully' });
        });

        it('responde 400 si falla la edición', async () => {
            mockedProductModel.edit.mockRejectedValueOnce(new Error('boom'));
            const res = buildRes();

            await editProduct(buildReq<EditProductRequest>({ body: { _id: 'product-1' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
