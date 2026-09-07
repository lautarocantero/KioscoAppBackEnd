import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationModel } from '../notificationModel';
import { NotificationSchema } from '../../schemas/notificationSchema';

vi.mock('../../schemas/notificationSchema', () => ({
    NotificationSchema: {
        find: vi.fn(),
        create: vi.fn(),
        findOneAndUpdate: vi.fn(),
        findOneAndDelete: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
    },
}));

const mockedNotificationSchema = vi.mocked(NotificationSchema);

const findChain = (value: unknown) => ({ sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(value) }) });

describe('NotificationModel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAll', () => {
        it('resuelve status por usuario a partir de readBy', async () => {
            mockedNotificationSchema.find.mockReturnValueOnce(findChain([
                { _id: 'notif-1', type: 'sale', payload: {}, readBy: ['user-1'] },
                { _id: 'n2', type: 'low_stock', payload: {}, readBy: [] },
            ]) as never);

            const result = await NotificationModel.getAll('kiosco-1', 'user-1');

            expect(mockedNotificationSchema.find).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1' });
            expect(result).toEqual([
                { _id: 'notif-1', type: 'sale', payload: {}, status: 'readed' },
                { _id: 'n2', type: 'low_stock', payload: {}, status: 'not-read-yet' },
            ]);
        });
    });

    describe('createSaleNotification', () => {
        it('crea la notificación con el payload de la venta', async () => {
            mockedNotificationSchema.create.mockResolvedValueOnce(undefined as never);

            await NotificationModel.createSaleNotification('kiosco-1', {
                sellId: 'sell-1', sellerId: 'seller-1', sellerName: 'Ana', amount: 1000, currency: 'ars',
            });

            expect(mockedNotificationSchema.create).toHaveBeenCalledWith(expect.objectContaining({
                kiosco_id: 'kiosco-1',
                type: 'sale',
                payload: { sellId: 'sell-1', sellerId: 'seller-1', sellerName: 'Ana', amount: 1000, currency: 'ars' },
                readBy: [],
            }));
        });

        it('lanza error si falta un campo requerido', async () => {
            await expect(NotificationModel.createSaleNotification('kiosco-1', {
                sellId: '', sellerId: 'seller-1', sellerName: 'Ana', amount: 1000, currency: 'ars',
            })).rejects.toThrow('No sell_id provided');
        });
    });

    describe('createLowStockNotification', () => {
        it('acepta units/minStock en 0 (isZeroValid)', async () => {
            mockedNotificationSchema.create.mockResolvedValueOnce(undefined as never);

            await NotificationModel.createLowStockNotification('kiosco-1', {
                presentationId: 'pres-1', productId: 'prod-1', productName: 'Pan', units: 0, minStock: 5,
            });

            expect(mockedNotificationSchema.create).toHaveBeenCalledWith(expect.objectContaining({
                type: 'low_stock',
                payload: { presentationId: 'pres-1', productId: 'prod-1', productName: 'Pan', units: 0, minStock: 5 },
            }));
        });
    });

    describe('markAsRead', () => {
        it('agrega al usuario a readBy', async () => {
            mockedNotificationSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'notif-1' } as never);

            await NotificationModel.markAsRead('kiosco-1', 'notif-1', 'user-1');

            expect(mockedNotificationSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'notif-1', kiosco_id: 'kiosco-1' },
                { $addToSet: { readBy: 'user-1' } },
            );
        });

        it('lanza error si la notificación no existe', async () => {
            mockedNotificationSchema.findOneAndUpdate.mockResolvedValueOnce(null as never);

            await expect(NotificationModel.markAsRead('kiosco-1', 'notif-1', 'user-1'))
                .rejects.toThrow('There is not any notification with that id notif-1');
        });
    });

    describe('markAsUnread', () => {
        it('saca al usuario de readBy', async () => {
            mockedNotificationSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'notif-1' } as never);

            await NotificationModel.markAsUnread('kiosco-1', 'notif-1', 'user-1');

            expect(mockedNotificationSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'notif-1', kiosco_id: 'kiosco-1' },
                { $pull: { readBy: 'user-1' } },
            );
        });

        it('lanza error si la notificación no existe', async () => {
            mockedNotificationSchema.findOneAndUpdate.mockResolvedValueOnce(null as never);

            await expect(NotificationModel.markAsUnread('kiosco-1', 'notif-1', 'user-1'))
                .rejects.toThrow('There is not any notification with that id notif-1');
        });
    });

    describe('markAllAsRead', () => {
        it('marca como leídas todas las que el usuario no había leído', async () => {
            mockedNotificationSchema.updateMany.mockResolvedValueOnce(undefined as never);

            await NotificationModel.markAllAsRead('kiosco-1', 'user-1');

            expect(mockedNotificationSchema.updateMany).toHaveBeenCalledWith(
                { kiosco_id: 'kiosco-1', readBy: { $ne: 'user-1' } },
                { $addToSet: { readBy: 'user-1' } },
            );
        });
    });

    describe('deleteOne', () => {
        it('elimina la notificación del kiosco', async () => {
            mockedNotificationSchema.findOneAndDelete.mockResolvedValueOnce({ _id: 'notif-1' } as never);

            await NotificationModel.deleteOne('kiosco-1', 'notif-1');

            expect(mockedNotificationSchema.findOneAndDelete).toHaveBeenCalledWith({ _id: 'notif-1', kiosco_id: 'kiosco-1' });
        });

        it('lanza error si no existe', async () => {
            mockedNotificationSchema.findOneAndDelete.mockResolvedValueOnce(null as never);

            await expect(NotificationModel.deleteOne('kiosco-1', 'notif-1')).rejects.toThrow('There is not any notification with that id notif-1');
        });
    });

    describe('deleteAll', () => {
        it('elimina todas las notificaciones del kiosco', async () => {
            mockedNotificationSchema.deleteMany.mockResolvedValueOnce(undefined as never);

            await NotificationModel.deleteAll('kiosco-1');

            expect(mockedNotificationSchema.deleteMany).toHaveBeenCalledWith({ kiosco_id: 'kiosco-1' });
        });
    });
});
