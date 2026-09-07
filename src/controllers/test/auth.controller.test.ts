import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { buildRes } from '../../test/controllerTestUtils';
import { AuthModel } from '../../models/authModel';
import { KioscoModel } from '../../models/kioscoModel';
import { SellerModel } from '../../models/sellerModel';
import { REFRESH_SECRET, ACCESS_SECRET } from '../../config';
import {
    checkAuth,
    deleteAuth,
    editAuth,
    googleLogin,
    home,
    login,
    logout,
    refresh,
    register,
    requestPasswordReset,
    resetPassword,
} from '../auth.controller';

vi.mock('../../models/authModel', () => ({
    AuthModel: {
        create: vi.fn(),
        login: vi.fn(),
        loginOrCreateWithGoogle: vi.fn(),
        saveRefreshToken: vi.fn(),
        deleteRefreshToken: vi.fn(),
        checkAuth: vi.fn(),
        deleteAuth: vi.fn(),
        editAuth: vi.fn(),
        requestPasswordReset: vi.fn(),
        resetPassword: vi.fn(),
    },
}));

vi.mock('../../models/kioscoModel', () => ({
    KioscoModel: { getMyKioscos: vi.fn() },
}));

vi.mock('../../models/sellerModel', () => ({
    SellerModel: { edit: vi.fn() },
}));

vi.mock('axios');

const mockedAuthModel = vi.mocked(AuthModel);
const mockedKioscoModel = vi.mocked(KioscoModel);
const mockedSellerModel = vi.mocked(SellerModel);
const mockedAxios = vi.mocked(axios);

const buildReq = <T = Request>(overrides: Record<string, unknown> = {}): T =>
    ({ params: {}, body: {}, query: {}, cookies: {}, ...overrides }) as unknown as T;

describe('auth.controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedKioscoModel.getMyKioscos.mockResolvedValue([]);
    });

    describe('home', () => {
        it('devuelve 200 con el listado de endpoints en HTML', async () => {
            const res = buildRes();

            await home(buildReq(), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(expect.stringContaining('/register'));
        });
    });

    describe('register', () => {
        it('crea el usuario y responde 200 con el id', async () => {
            mockedAuthModel.create.mockResolvedValueOnce({ _id: 'user-1' });
            const res = buildRes();

            await register(buildReq({ body: { email: 'a@a.com', password: '123456', repeatPassword: '123456', name: 'Ana' } }), res);

            expect(mockedAuthModel.create).toHaveBeenCalledWith({ email: 'a@a.com', password: '123456', repeatPassword: '123456', name: 'Ana', profilePhoto: undefined });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'user-1', message: 'User Registered successfully' });
        });

        it('responde 400 si el modelo rechaza el registro (ej. email duplicado)', async () => {
            mockedAuthModel.create.mockRejectedValueOnce(new Error('email already exists'));
            const res = buildRes();

            await register(buildReq({ body: { email: 'a@a.com', password: '123456', repeatPassword: '123456', name: 'Ana' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'email already exists' });
        });
    });

    describe('login', () => {
        it('setea cookies de sesión y devuelve usuario + kioscos', async () => {
            mockedAuthModel.login.mockResolvedValueOnce({ _id: 'user-1', email: 'a@a.com' } as never);
            mockedKioscoModel.getMyKioscos.mockResolvedValueOnce([{ _id: 'kiosco-1' }] as never);
            const res = buildRes();

            await login(buildReq({ body: { email: 'a@a.com', password: '123456', rememberMe: false } }), res);

            expect(res.cookie).toHaveBeenCalledWith('access_token', expect.any(String), expect.any(Object));
            expect(res.cookie).toHaveBeenCalledWith('refresh_token', expect.any(String), expect.any(Object));
            expect(mockedAuthModel.saveRefreshToken).toHaveBeenCalledWith({ _id: 'user-1', token: expect.any(String) });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                user: { _id: 'user-1', email: 'a@a.com' },
                myKioscos: [{ _id: 'kiosco-1' }],
                message: 'User Logged successfully',
            });
        });

        it('responde 400 si las credenciales son inválidas', async () => {
            mockedAuthModel.login.mockRejectedValueOnce(new Error('email does not exist'));
            const res = buildRes();

            await login(buildReq({ body: { email: 'nadie@a.com', password: 'x', rememberMe: false } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'email does not exist' });
            expect(res.cookie).not.toHaveBeenCalled();
        });
    });

    describe('googleLogin', () => {
        it('resuelve el perfil de Google y loguea/crea la cuenta', async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: { email: 'a@a.com', name: 'Ana', picture: 'http://x/a.png' } });
            mockedAuthModel.loginOrCreateWithGoogle.mockResolvedValueOnce({ _id: 'user-1', email: 'a@a.com' } as never);
            const res = buildRes();

            await googleLogin(buildReq({ body: { accessToken: 'gtoken' } }), res);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                { headers: { Authorization: 'Bearer gtoken' } },
            );
            expect(mockedAuthModel.loginOrCreateWithGoogle).toHaveBeenCalledWith({ email: 'a@a.com', name: 'Ana', profilePhoto: 'http://x/a.png' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si el token de Google es inválido', async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error('Request failed with status code 401'));
            const res = buildRes();

            await googleLogin(buildReq({ body: { accessToken: 'trucho' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('logout', () => {
        it('responde 401 si no hay refresh_token', async () => {
            const res = buildRes();

            await logout(buildReq({ cookies: {} }), res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockedAuthModel.deleteRefreshToken).not.toHaveBeenCalled();
        });

        it('borra el refresh token, marca offline y limpia las cookies', async () => {
            const token = jwt.sign({ id: 'user-1' }, REFRESH_SECRET);
            mockedAuthModel.deleteRefreshToken.mockResolvedValueOnce(undefined);
            mockedSellerModel.edit.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await logout(buildReq({ cookies: { refresh_token: token } }), res);

            expect(mockedAuthModel.deleteRefreshToken).toHaveBeenCalledWith({ _id: 'user-1' });
            expect(mockedSellerModel.edit).toHaveBeenCalledWith({ _id: 'user-1', user_status: 'offline' });
            expect(res.clearCookie).toHaveBeenCalledWith('access_token');
            expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('completa el logout aunque falle marcar al vendedor offline', async () => {
            const token = jwt.sign({ id: 'user-1' }, REFRESH_SECRET);
            mockedAuthModel.deleteRefreshToken.mockResolvedValueOnce(undefined);
            mockedSellerModel.edit.mockRejectedValueOnce(new Error('seller not found'));
            const res = buildRes();

            await logout(buildReq({ cookies: { refresh_token: token } }), res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 401 si el refresh_token está firmado con otro secreto', async () => {
            const forgedToken = jwt.sign({ id: 'user-1' }, 'otro-secreto');
            const res = buildRes();

            await logout(buildReq({ cookies: { refresh_token: forgedToken } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('checkAuth', () => {
        it('responde 401 si no hay refresh_token', async () => {
            const res = buildRes();

            await checkAuth(buildReq({ cookies: {} }), res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('devuelve la sesión combinada con los kioscos del usuario', async () => {
            const token = jwt.sign({ id: 'user-1' }, REFRESH_SECRET);
            mockedAuthModel.checkAuth.mockResolvedValueOnce({ _id: 'user-1', email: 'a@a.com' } as never);
            mockedKioscoModel.getMyKioscos.mockResolvedValueOnce([{ _id: 'kiosco-1' }] as never);
            const res = buildRes();

            await checkAuth(buildReq({ cookies: { refresh_token: token } }), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ _id: 'user-1', email: 'a@a.com', myKioscos: [{ _id: 'kiosco-1' }] });
        });
    });

    describe('refresh', () => {
        it('responde 401 si no hay refresh_token', async () => {
            const res = buildRes();

            await refresh(buildReq({ cookies: {} }), res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('emite un nuevo access_token si el usuario sigue existiendo', async () => {
            const token = jwt.sign({ id: 'user-1', email: 'a@a.com' }, REFRESH_SECRET);
            mockedAuthModel.checkAuth.mockResolvedValueOnce({ _id: 'user-1' } as never);
            const res = buildRes();

            await refresh(buildReq({ cookies: { refresh_token: token } }), res);

            expect(res.cookie).toHaveBeenCalledWith('access_token', expect.any(String), expect.any(Object));
            const [, issuedToken] = (res.cookie as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(jwt.verify(issuedToken, ACCESS_SECRET)).toMatchObject({ id: 'user-1', email: 'a@a.com' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si el usuario ya no existe', async () => {
            const token = jwt.sign({ id: 'user-1', email: 'a@a.com' }, REFRESH_SECRET);
            mockedAuthModel.checkAuth.mockRejectedValueOnce(new Error('User not found'));
            const res = buildRes();

            await refresh(buildReq({ cookies: { refresh_token: token } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.cookie).not.toHaveBeenCalled();
        });
    });

    describe('requestPasswordReset', () => {
        it('devuelve el token si el email existe (bypass temporal)', async () => {
            mockedAuthModel.requestPasswordReset.mockResolvedValueOnce({ resetToken: 'tok-123' });
            const res = buildRes();

            await requestPasswordReset(buildReq({ body: { email: 'a@a.com' } }), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'If that email exists, a reset link has been sent', token: 'tok-123' });
        });

        it('devuelve token null sin filtrar si el email no existe', async () => {
            mockedAuthModel.requestPasswordReset.mockResolvedValueOnce(null);
            const res = buildRes();

            await requestPasswordReset(buildReq({ body: { email: 'nadie@a.com' } }), res);

            expect(res.json).toHaveBeenCalledWith({ message: 'If that email exists, a reset link has been sent', token: null });
        });
    });

    describe('resetPassword', () => {
        it('responde 200 si el reset fue exitoso', async () => {
            mockedAuthModel.resetPassword.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await resetPassword(buildReq({ body: { token: 'tok-123', newPassword: 'nueva123', repeatNewPassword: 'nueva123' } }), res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successfully' });
        });

        it('responde 400 si el token es inválido o venció', async () => {
            mockedAuthModel.resetPassword.mockRejectedValueOnce(new Error('Invalid reset token'));
            const res = buildRes();

            await resetPassword(buildReq({ body: { token: 'tok-malo', newPassword: 'nueva123', repeatNewPassword: 'nueva123' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('deleteAuth', () => {
        it('borra la cuenta de la sesión actual (nunca un _id del body)', async () => {
            mockedAuthModel.deleteAuth.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await deleteAuth(buildReq({ user: { id: 'user-1' }, body: { _id: 'otra-cuenta' } }), res);

            expect(mockedAuthModel.deleteAuth).toHaveBeenCalledWith({ _id: 'user-1' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ _id: 'user-1', message: 'Auth deleted successfully' });
        });
    });

    describe('editAuth', () => {
        it('edita solo la cuenta de la sesión actual, ignorando cualquier _id del body', async () => {
            mockedAuthModel.editAuth.mockResolvedValueOnce(undefined);
            const res = buildRes();

            await editAuth(buildReq({ user: { id: 'user-1' }, body: { email: 'nuevo@a.com' } }), res);

            expect(mockedAuthModel.editAuth).toHaveBeenCalledWith({ _id: 'user-1', email: 'nuevo@a.com', password: undefined });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('responde 400 si el modelo rechaza la edición', async () => {
            mockedAuthModel.editAuth.mockRejectedValueOnce(new Error('User not found'));
            const res = buildRes();

            await editAuth(buildReq({ user: { id: 'user-1' }, body: { email: 'nuevo@a.com' } }), res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
