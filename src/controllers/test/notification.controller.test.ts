import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import { buildRes } from '../../test/controllerTestUtils';
import { NotificationModel } from '../../models/notificationModel';
import {
    deleteAllNotifications,
    deleteNotification,
    getNotifications,
    markAllAsRead,
    markAsRead,
    markAsUnread,
} from '../notification.controller';

vi.mock('../../models/notificationModel', () => ({
    NotificationModel: {
        getAll: vi.fn(),
        markAsRead: vi.fn(),
        markAsUnread: vi.fn(),
        markAllAsRead: vi.fn(),
        deleteOne: vi.fn(),
        deleteAll: vi.fn(),
    },
}));

const mockedNotificationModel = vi.mocked(NotificationModel);

const buildReq = <T = Request>(overrides: Record<string, unknown> = {}): T =>
    ({ kioscoId: 'kiosco-1', params: {}, body: {}, query: {}, user: { id: 'user-1', email: 'a@a.com' }, ...overrides }) as unknown as T;

describe('notification.controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getNotifications', () => {
        it('devuelve las notificaciones del kiosco activo', async () => {
            mockedNotificationModel.getAll.mockResolvedValueOnce([{ _id: 'n1' }] as never);
            const res = buildRes();

            await getNotifications(buildReq(), res);

            expect(mockedNotificationModel.getAll).toHaveBeenCalledWith('kiosco-1', 'user-1');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 401 si no hay usuario autenticado', async () => {
            const res = buildRes();

            await getNotifications(buildReq({ user: undefined }), res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockedNotificationModel.getAll).not.toHaveBeenCalled();
        });
    });

    describe('markAsRead', () => {
        it('marca la notificación como leída para el usuario actual', async () => {
            mockedNotificationModel.markAsRead.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await markAsRead(buildReq({ body: { _id: 'n1' } }), res);

            expect(mockedNotificationModel.markAsRead).toHaveBeenCalledWith('kiosco-1', 'n1', 'user-1');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 401 si no hay usuario autenticado', async () => {
            const res = buildRes();

            await markAsRead(buildReq({ user: undefined, body: { _id: 'n1' } }), res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('responde 400 si la notificación no existe', async () => {
            mockedNotificationModel.markAsRead.mockRejectedValueOnce(new Error('There is not any notification with that id n1'));
            const res = buildRes();

            await markAsRead(buildReq({ body: { _id: 'n1' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('markAsUnread', () => {
        it('marca la notificación como no leída para el usuario actual', async () => {
            mockedNotificationModel.markAsUnread.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await markAsUnread(buildReq({ body: { _id: 'n1' } }), res);

            expect(mockedNotificationModel.markAsUnread).toHaveBeenCalledWith('kiosco-1', 'n1', 'user-1');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 401 si no hay usuario autenticado', async () => {
            const res = buildRes();

            await markAsUnread(buildReq({ user: undefined, body: { _id: 'n1' } }), res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('markAllAsRead', () => {
        it('marca todas como leídas para el usuario actual', async () => {
            mockedNotificationModel.markAllAsRead.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await markAllAsRead(buildReq(), res);

            expect(mockedNotificationModel.markAllAsRead).toHaveBeenCalledWith('kiosco-1', 'user-1');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 401 si no hay usuario autenticado', async () => {
            const res = buildRes();

            await markAllAsRead(buildReq({ user: undefined }), res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('deleteNotification', () => {
        it('elimina la notificación del kiosco activo', async () => {
            mockedNotificationModel.deleteOne.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await deleteNotification(buildReq({ body: { _id: 'n1' } }), res);

            expect(mockedNotificationModel.deleteOne).toHaveBeenCalledWith('kiosco-1', 'n1');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si no existe', async () => {
            mockedNotificationModel.deleteOne.mockRejectedValueOnce(new Error('There is not any notification with that id n1'));
            const res = buildRes();

            await deleteNotification(buildReq({ body: { _id: 'n1' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('deleteAllNotifications', () => {
        it('elimina todas las notificaciones del kiosco activo', async () => {
            mockedNotificationModel.deleteAll.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await deleteAllNotifications(buildReq(), res);

            expect(mockedNotificationModel.deleteAll).toHaveBeenCalledWith('kiosco-1');
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
