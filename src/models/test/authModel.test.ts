import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { AuthModel } from '../authModel';
import { AuthSchema } from '../../schemas/authSchema';
import { SellerSchema } from '../../schemas/sellerSchema';
import { KioscoMembershipSchema } from '../../schemas/kioscoMembershipSchema';
import { SellerStatus } from '../../typings/seller/sellerEnums';

vi.mock('../../schemas/authSchema', () => ({
    AuthSchema: {
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
        findOneAndDelete: vi.fn(),
        create: vi.fn(),
    },
}));

vi.mock('../../schemas/sellerSchema', () => ({
    SellerSchema: {
        create: vi.fn(),
        findOneAndUpdate: vi.fn(),
        findOneAndDelete: vi.fn(),
    },
}));

vi.mock('../../schemas/kioscoMembershipSchema', () => ({
    KioscoMembershipSchema: {
        deleteMany: vi.fn(),
    },
}));

vi.mock('mongoose', () => ({
    default: {
        startSession: vi.fn(),
    },
}));

const mockedAuthSchema = vi.mocked(AuthSchema);
const mockedSellerSchema = vi.mocked(SellerSchema);
const mockedKioscoMembershipSchema = vi.mocked(KioscoMembershipSchema);
const mockedMongoose = vi.mocked(mongoose);

// Helpers para encadenar `.lean()`/`.session()` como el driver real de mongoose.
const lean = (value: unknown) => ({ lean: vi.fn().mockResolvedValue(value) });
const withSession = (value: unknown) => ({ session: vi.fn().mockResolvedValue(value) });

describe('AuthModel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedMongoose.startSession.mockResolvedValue({
            endSession: vi.fn(),
            withTransaction: vi.fn(async (fn: () => Promise<void>) => { await fn(); }),
        } as never);
    });

    describe('getRefreshToken', () => {
        it('devuelve el refreshToken del usuario', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ refreshToken: 'rt-1' }) as never);

            const result = await AuthModel.getRefreshToken({ _id: 'user-1' });

            expect(mockedAuthSchema.findOne).toHaveBeenCalledWith({ _id: 'user-1' });
            expect(result).toEqual({ refreshToken: 'rt-1' });
        });

        it('lanza error si el usuario no existe', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean(null) as never);

            await expect(AuthModel.getRefreshToken({ _id: 'user-1' })).rejects.toThrow('User not found');
        });

        it('lanza error si el usuario no tiene refresh token guardado', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ refreshToken: '' }) as never);

            await expect(AuthModel.getRefreshToken({ _id: 'user-1' })).rejects.toThrow('Missing refresh token in cookies');
        });
    });

    describe('checkAuth', () => {
        it('combina Auth + Seller y marca al vendedor online', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({
                _id: 'user-1', email: 'a@a.com', password: 'hash', refreshToken: 'rt',
                verificationToken: null, verificationTokenExpires: null,
                resetPasswordToken: null, resetPasswordTokenExpires: null,
                plan: 'standard', plan_status: 'active', mp_preapproval_id: null,
            }) as never);
            mockedSellerSchema.findOneAndUpdate.mockReturnValueOnce(lean({ _id: 'user-1', name: 'Ana', user_status: SellerStatus.online }) as never);

            const result = await AuthModel.checkAuth({ _id: 'user-1' });

            expect(mockedSellerSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'user-1' },
                { $set: { user_status: SellerStatus.online } },
                { returnDocument: 'after' },
            );
            expect(result).not.toHaveProperty('password');
            expect(result).toMatchObject({ _id: 'user-1', email: 'a@a.com', name: 'Ana' });
        });

        it('lanza error si el usuario de Auth no existe', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean(null) as never);

            await expect(AuthModel.checkAuth({ _id: 'user-1' })).rejects.toThrow('User not found');
        });

        it('lanza error si el perfil de Seller no existe', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ _id: 'user-1' }) as never);
            mockedSellerSchema.findOneAndUpdate.mockReturnValueOnce(lean(null) as never);

            await expect(AuthModel.checkAuth({ _id: 'user-1' })).rejects.toThrow('Seller profile not found');
        });
    });

    describe('create', () => {
        const payload = { email: 'nueva@stocko.com', password: '123456', repeatPassword: '123456', name: 'Ana' };

        it('crea Auth + Seller dentro de una transacción', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean(null) as never);
            mockedAuthSchema.create.mockResolvedValueOnce(undefined as never);
            mockedSellerSchema.create.mockResolvedValueOnce(undefined as never);

            const result = await AuthModel.create(payload);

            expect(result._id).toEqual(expect.any(String));
            expect(mockedAuthSchema.create).toHaveBeenCalledWith(
                [expect.objectContaining({ email: 'nueva@stocko.com' })],
                { session: expect.anything() },
            );
            expect(mockedSellerSchema.create).toHaveBeenCalledWith(
                [expect.objectContaining({ name: 'Ana' })],
                { session: expect.anything() },
            );
        });

        it('lanza error si el email ya existe', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ _id: 'existing' }) as never);

            await expect(AuthModel.create(payload)).rejects.toThrow('email already exists');
            expect(mockedAuthSchema.create).not.toHaveBeenCalled();
        });

        it('lanza error si el email tiene formato inválido', async () => {
            await expect(AuthModel.create({ ...payload, email: 'no-es-un-email' })).rejects.toThrow('email has an invalid format');
        });

        it('lanza error si la contraseña es demasiado corta', async () => {
            await expect(AuthModel.create({ ...payload, password: 'ab', repeatPassword: 'ab' })).rejects.toThrow('password must be at least 3 characters long');
        });
    });

    describe('login', () => {
        it('autentica con credenciales correctas y marca al vendedor online', async () => {
            const hashedPassword = await bcrypt.hash('correcta123', 10);
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ _id: 'user-1', email: 'a@a.com', password: hashedPassword }) as never);
            mockedSellerSchema.findOneAndUpdate.mockReturnValueOnce(lean({ _id: 'user-1', name: 'Ana', user_status: SellerStatus.online }) as never);

            const result = await AuthModel.login({ email: 'a@a.com', password: 'correcta123', rememberMe: false });

            expect(result).toMatchObject({ _id: 'user-1', email: 'a@a.com', name: 'Ana' });
            expect(result).not.toHaveProperty('password');
        });

        it('lanza error si el email no existe', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean(null) as never);

            await expect(AuthModel.login({ email: 'nadie@a.com', password: 'x', rememberMe: false })).rejects.toThrow('email does not exist');
        });

        it('lanza error si la contraseña es incorrecta', async () => {
            const hashedPassword = await bcrypt.hash('correcta123', 10);
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ _id: 'user-1', email: 'a@a.com', password: hashedPassword }) as never);

            await expect(AuthModel.login({ email: 'a@a.com', password: 'incorrecta', rememberMe: false }))
                .rejects.toThrow('Password is incorrect. Make sure caps lock is off and try again.');
        });

        it('lanza error si el perfil de Seller no existe', async () => {
            const hashedPassword = await bcrypt.hash('correcta123', 10);
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ _id: 'user-1', email: 'a@a.com', password: hashedPassword }) as never);
            mockedSellerSchema.findOneAndUpdate.mockReturnValueOnce(lean(null) as never);

            await expect(AuthModel.login({ email: 'a@a.com', password: 'correcta123', rememberMe: false })).rejects.toThrow('Seller profile not found');
        });
    });

    describe('loginOrCreateWithGoogle', () => {
        it('loguea directo si ya existe una cuenta con ese email', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ _id: 'user-1', email: 'a@a.com' }) as never);
            mockedSellerSchema.findOneAndUpdate.mockReturnValueOnce(lean({ _id: 'user-1', name: 'Ana', user_status: SellerStatus.online }) as never);

            const result = await AuthModel.loginOrCreateWithGoogle({ email: 'a@a.com', name: 'Ana' });

            expect(result).toMatchObject({ _id: 'user-1', name: 'Ana' });
            expect(mockedAuthSchema.create).not.toHaveBeenCalled();
        });

        it('crea la cuenta ya online si no existía', async () => {
            mockedAuthSchema.findOne
                .mockReturnValueOnce(lean(null) as never) // existingAuth
                .mockReturnValueOnce(lean({ _id: expect.any(String), email: 'nueva@a.com' }) as never); // checkAuth interno
            mockedAuthSchema.create.mockResolvedValueOnce(undefined as never);
            mockedSellerSchema.create.mockResolvedValueOnce(undefined as never);
            mockedSellerSchema.findOneAndUpdate.mockReturnValueOnce(lean({ _id: 'nuevo', name: 'Bea', user_status: SellerStatus.online }) as never);

            const result = await AuthModel.loginOrCreateWithGoogle({ email: 'nueva@a.com', name: 'Bea' });

            expect(mockedSellerSchema.create).toHaveBeenCalledWith(
                [expect.objectContaining({ name: 'Bea', user_status: SellerStatus.online })],
                { session: expect.anything() },
            );
            expect(result).toMatchObject({ name: 'Bea' });
        });
    });

    describe('requestPasswordReset', () => {
        it('devuelve un token si el email existe', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ _id: 'user-1' }) as never);
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce(undefined as never);

            const result = await AuthModel.requestPasswordReset({ email: 'a@a.com' });

            expect(result?.resetToken).toEqual(expect.any(String));
            expect(mockedAuthSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'user-1' },
                { $set: { resetPasswordToken: expect.any(String), resetPasswordTokenExpires: expect.any(Date) } },
            );
        });

        it('devuelve null sin filtrar si el email no existe (no revela existencia de cuenta)', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean(null) as never);

            const result = await AuthModel.requestPasswordReset({ email: 'nadie@a.com' });

            expect(result).toBeNull();
            expect(mockedAuthSchema.findOneAndUpdate).not.toHaveBeenCalled();
        });
    });

    describe('resetPassword', () => {
        it('actualiza la contraseña con un token válido y no vencido', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({
                _id: 'user-1', resetPasswordTokenExpires: new Date(Date.now() + 60_000),
            }) as never);
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce(undefined as never);

            await AuthModel.resetPassword({ token: 'tok-valido', newPassword: 'nueva123', repeatNewPassword: 'nueva123' });

            expect(mockedAuthSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'user-1' },
                {
                    $set: { password: expect.any(String) },
                    $unset: { resetPasswordToken: '', resetPasswordTokenExpires: '', refreshToken: '' },
                },
            );
        });

        it('lanza error si las contraseñas no coinciden', async () => {
            await expect(AuthModel.resetPassword({ token: 'tok-valido', newPassword: 'nueva123', repeatNewPassword: 'otra456' }))
                .rejects.toThrow('Passwords do not match');
        });

        it('lanza error si el token no existe', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean(null) as never);

            await expect(AuthModel.resetPassword({ token: 'tok-invalido', newPassword: 'nueva123', repeatNewPassword: 'nueva123' }))
                .rejects.toThrow('Invalid reset token');
        });

        it('lanza error si el token ya venció', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({
                _id: 'user-1', resetPasswordTokenExpires: new Date(Date.now() - 60_000),
            }) as never);

            await expect(AuthModel.resetPassword({ token: 'tok-vencido', newPassword: 'nueva123', repeatNewPassword: 'nueva123' }))
                .rejects.toThrow('Reset token has expired');
        });
    });

    describe('verifyEmail', () => {
        it('marca el email como verificado con un token válido', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({
                _id: 'user-1', isVerified: false, verificationTokenExpires: new Date(Date.now() + 60_000),
            }) as never);
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce(undefined as never);

            await AuthModel.verifyEmail({ token: 'tok-valido' });

            expect(mockedAuthSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'user-1' },
                { $set: { isVerified: true }, $unset: { verificationToken: '', verificationTokenExpires: '' } },
            );
        });

        it('lanza error si el token no existe', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean(null) as never);

            await expect(AuthModel.verifyEmail({ token: 'tok-invalido' })).rejects.toThrow('Invalid verification token');
        });

        it('lanza error si el email ya estaba verificado', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({ _id: 'user-1', isVerified: true }) as never);

            await expect(AuthModel.verifyEmail({ token: 'tok-valido' })).rejects.toThrow('Email is already verified');
        });

        it('lanza error si el token ya venció', async () => {
            mockedAuthSchema.findOne.mockReturnValueOnce(lean({
                _id: 'user-1', isVerified: false, verificationTokenExpires: new Date(Date.now() - 60_000),
            }) as never);

            await expect(AuthModel.verifyEmail({ token: 'tok-vencido' })).rejects.toThrow('Verification token has expired');
        });
    });

    describe('deleteAuth', () => {
        it('borra Auth, Seller y las membresías de kiosco en cascada', async () => {
            mockedAuthSchema.findOneAndDelete.mockReturnValueOnce(withSession({ _id: 'user-1' }) as never);
            mockedSellerSchema.findOneAndDelete.mockReturnValueOnce(withSession(undefined) as never);
            mockedKioscoMembershipSchema.deleteMany.mockReturnValueOnce(withSession(undefined) as never);

            await AuthModel.deleteAuth({ _id: 'user-1' });

            expect(mockedSellerSchema.findOneAndDelete).toHaveBeenCalledWith({ _id: 'user-1' });
            expect(mockedKioscoMembershipSchema.deleteMany).toHaveBeenCalledWith({ user_id: 'user-1' });
        });

        it('lanza error si el usuario no existe', async () => {
            mockedAuthSchema.findOneAndDelete.mockReturnValueOnce(withSession(null) as never);

            await expect(AuthModel.deleteAuth({ _id: 'user-1' })).rejects.toThrow('User not found');
            expect(mockedSellerSchema.findOneAndDelete).not.toHaveBeenCalled();
        });
    });

    describe('saveRefreshToken', () => {
        it('guarda el token', async () => {
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'user-1' } as never);

            await AuthModel.saveRefreshToken({ _id: 'user-1', token: 'rt-nuevo' });

            expect(mockedAuthSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'user-1' },
                { $set: { refreshToken: 'rt-nuevo' } },
            );
        });

        it('lanza error si el usuario no existe', async () => {
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce(null as never);

            await expect(AuthModel.saveRefreshToken({ _id: 'user-1', token: 'rt-nuevo' })).rejects.toThrow('User not found');
        });
    });

    describe('deleteRefreshToken', () => {
        it('borra el token si el usuario lo tiene', async () => {
            mockedAuthSchema.findOne.mockResolvedValueOnce({ _id: 'user-1', refreshToken: 'rt-actual' } as never);
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce(undefined as never);

            await AuthModel.deleteRefreshToken({ _id: 'user-1', token: 'ignorado' });

            expect(mockedAuthSchema.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'user-1' }, { $unset: { refreshToken: '' } });
        });

        it('lanza error si el usuario no existe', async () => {
            mockedAuthSchema.findOne.mockResolvedValueOnce(null as never);

            await expect(AuthModel.deleteRefreshToken({ _id: 'user-1', token: 'x' })).rejects.toThrow('User not found');
        });

        it('lanza error si el usuario no tiene refresh token', async () => {
            mockedAuthSchema.findOne.mockResolvedValueOnce({ _id: 'user-1', refreshToken: '' } as never);

            await expect(AuthModel.deleteRefreshToken({ _id: 'user-1', token: 'x' })).rejects.toThrow('Missing refresh token in cookies');
        });
    });

    describe('editAuth', () => {
        it('actualiza el email', async () => {
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'user-1' } as never);

            await AuthModel.editAuth({ _id: 'user-1', email: 'nuevo@a.com' });

            expect(mockedAuthSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'user-1' },
                { $set: { email: 'nuevo@a.com' } },
            );
        });

        it('hashea la nueva contraseña antes de guardarla', async () => {
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce({ _id: 'user-1' } as never);

            await AuthModel.editAuth({ _id: 'user-1', password: 'nuevaClave123' });

            const [, update] = mockedAuthSchema.findOneAndUpdate.mock.calls[0] as [unknown, { $set: { password: string } }];
            expect(update.$set.password).not.toEqual('nuevaClave123');
            expect(await bcrypt.compare('nuevaClave123', update.$set.password)).toBe(true);
        });

        it('lanza error si el usuario no existe', async () => {
            mockedAuthSchema.findOneAndUpdate.mockResolvedValueOnce(null as never);

            await expect(AuthModel.editAuth({ _id: 'user-1', email: 'nuevo@a.com' })).rejects.toThrow('User not found');
        });
    });
});
