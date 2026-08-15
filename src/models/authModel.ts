import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { SALT_ROUNDS } from '../config';
import { AuthSchema } from '../schemas/authSchema';
import { SellerSchema } from '../schemas/sellerSchema';
import { Validation } from './validation';
import {
    AuthRegisterPayload, AuthLoginPayload, AuthTokenPublic, AuthSchemaType,
    AuthCheckAuthPayload, AuthRefreshTokenPayload, DeleteAuthPayload, EditAuthPayload,
    AuthGoogleLoginPayload, RequestPasswordResetPayload, ResetPasswordPayload,
    VerifyEmailPayload, SessionUser,
} from '../typings/auth';
import { AuthRoleEnum } from '../typings/auth/enums';
import { SellerStatus } from '../typings/seller/sellerEnums';

export class AuthModel {

    static async getRefreshToken(data: AuthRefreshTokenPayload): Promise<AuthTokenPublic> {
        const { _id } = data;
        const idResult = Validation.stringValidation(_id, '_id');
        const user = await AuthSchema.findOne({ _id: idResult }).lean();
        if (!user) throw new Error('User not found');
        const { refreshToken } = user as AuthSchemaType;
        if (!refreshToken) throw new Error('Missing refresh token in cookies');
        return { refreshToken } as AuthTokenPublic;
    }

    // Combina Auth (credenciales/autorización) + Seller (perfil) para la sesión
    static async checkAuth(data: AuthCheckAuthPayload): Promise<SessionUser> {
        const { _id } = data;
        const idResult = Validation.stringValidation(_id, '_id');

        const authObject = await AuthSchema.findOne({ _id: idResult }).lean();
        if (!authObject) throw new Error('User not found');

        const sellerObject = await SellerSchema.findOne({ _id: idResult }).lean();
        if (!sellerObject) throw new Error('Seller profile not found');

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _p, refreshToken: _rt, verificationToken: _vt, verificationTokenExpires: _vte,
                resetPasswordToken: _rpt, resetPasswordTokenExpires: _rpte, ...authPublic } = authObject as AuthSchemaType;

        return { ...authPublic, ...sellerObject } as SessionUser;
    }

    // Crea Auth + Seller como una unidad. El _id es compartido y se genera una sola vez.
    static async create(data: AuthRegisterPayload): Promise<{ _id: string }> {
        const { email, password, repeatPassword, name, profilePhoto } = data;

        const emailResult    = Validation.email(email);
        const passwordResult = Validation.password(password);
        Validation.password(repeatPassword);
        const nameResult     = Validation.stringValidation(name, 'name');
        const profileResult  = profilePhoto ? Validation.image(profilePhoto) : '';

        const existing = await AuthSchema.findOne({ email: emailResult }).lean();
        if (existing) throw new Error('email already exists');

        const _id = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(passwordResult, SALT_ROUNDS);

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await AuthSchema.create([{
                    _id,
                    email: emailResult,
                    password: hashedPassword,
                    refreshToken: '',
                    role: AuthRoleEnum.Seller,
                    isVerified: true, // TODO(email-verification): volver a `false` cuando se reactive el flujo
                }], { session });

                await SellerSchema.create([{
                    _id,
                    name: nameResult,
                    profilePhoto: profileResult,
                    created_at: new Date().toISOString(),
                    user_status: SellerStatus.offline,
                }], { session });
            });
        } finally {
            session.endSession();
        }

        return { _id };
    }

    static async login(data: AuthLoginPayload): Promise<SessionUser> {
        const { email, password } = data;
        const emailResult = Validation.email(email);

        const authObject = await AuthSchema.findOne({ email: emailResult }).lean();
        if (!authObject) throw new Error('email does not exist');

        const isValid = await bcrypt.compare(password as string, authObject.password as string);
        if (!isValid) throw new Error('Password is incorrect. Make sure caps lock is off and try again.');

        const sellerObject = await SellerSchema.findOne({ _id: authObject._id }).lean();
        if (!sellerObject) throw new Error('Seller profile not found');

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _p, refreshToken: _rt, verificationToken: _vt, verificationTokenExpires: _vte,
                resetPasswordToken: _rpt, resetPasswordTokenExpires: _rpte, ...authPublic } = authObject as AuthSchemaType;

        return { ...authPublic, ...sellerObject } as SessionUser;
    }

    static async loginOrCreateWithGoogle(data: AuthGoogleLoginPayload): Promise<SessionUser> {
        const { email, name, profilePhoto } = data;
        const emailResult = Validation.email(email);

        const existingAuth = await AuthSchema.findOne({ email: emailResult }).lean();

        if (existingAuth) {
            const sellerObject = await SellerSchema.findOne({ _id: existingAuth._id }).lean();
            if (!sellerObject) throw new Error('Seller profile not found');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _p, refreshToken: _rt, verificationToken: _vt, verificationTokenExpires: _vte,
                    resetPasswordToken: _rpt, resetPasswordTokenExpires: _rpte, ...authPublic } = existingAuth as AuthSchemaType;
            return { ...authPublic, ...sellerObject } as SessionUser;
        }

        const _id = crypto.randomUUID();
        const randomPassword = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS);

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await AuthSchema.create([{
                    _id,
                    email: emailResult,
                    password: hashedPassword,
                    refreshToken: '',
                    role: AuthRoleEnum.Seller,
                    isVerified: true,
                }], { session });

                await SellerSchema.create([{
                    _id,
                    name,
                    profilePhoto: profilePhoto ?? '',
                    created_at: new Date().toISOString(),
                    user_status: SellerStatus.offline,
                }], { session });
            });
        } finally {
            session.endSession();
        }

        return this.checkAuth({ _id });
    }

    static async requestPasswordReset(data: RequestPasswordResetPayload): Promise<{ resetToken: string } | null> {
        const { email } = data;
        const emailResult = Validation.email(email);

        const user = await AuthSchema.findOne({ email: emailResult }).lean();
        if (!user) return null;

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

        await AuthSchema.findOneAndUpdate(
            { _id: user._id },
            { $set: { resetPasswordToken: resetToken, resetPasswordTokenExpires } },
        );

        return { resetToken };
        // (antes devolvía `username` acá para el email; si el template de mail lo necesita,
        // se resuelve con SellerSchema.findOne({ _id: user._id }) cuando se reactive Resend)
    }

    static async resetPassword(data: ResetPasswordPayload): Promise<void> {
        const { token, newPassword, repeatNewPassword } = data;

        const tokenResult = Validation.stringValidation(token, 'token');
        const passwordResult = Validation.password(newPassword);
        Validation.password(repeatNewPassword);
        if (newPassword !== repeatNewPassword) throw new Error('Passwords do not match');

        const user = await AuthSchema.findOne({ resetPasswordToken: tokenResult }).lean();
        if (!user) throw new Error('Invalid reset token');
        if (!user.resetPasswordTokenExpires || user.resetPasswordTokenExpires < new Date()) {
            throw new Error('Reset token has expired');
        }

        const hashedPassword = await bcrypt.hash(passwordResult, SALT_ROUNDS);

        await AuthSchema.findOneAndUpdate(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetPasswordToken: '', resetPasswordTokenExpires: '', refreshToken: '' },
            },
        );
    }

    static async verifyEmail(data: VerifyEmailPayload): Promise<void> {
        const { token } = data;
        const tokenResult = Validation.stringValidation(token, 'token');

        const user = await AuthSchema.findOne({ verificationToken: tokenResult }).lean();
        if (!user) throw new Error('Invalid verification token');
        if (user.isVerified) throw new Error('Email is already verified');
        if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
            throw new Error('Verification token has expired');
        }

        await AuthSchema.findOneAndUpdate(
            { _id: user._id },
            { $set: { isVerified: true }, $unset: { verificationToken: '', verificationTokenExpires: '' } },
        );
    }

    // Cascada: borrar la identidad borra también el perfil, porque es 1:1
    static async deleteAuth(data: DeleteAuthPayload): Promise<void> {
        const { _id } = data;
        const _idResult = Validation.stringValidation(_id, '_id');

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const deletedAuth = await AuthSchema.findOneAndDelete({ _id: _idResult }).session(session);
                if (!deletedAuth) throw new Error('User not found');
                await SellerSchema.findOneAndDelete({ _id: _idResult }).session(session);
            });
        } finally {
            session.endSession();
        }
    }

    static async saveRefreshToken(data: AuthRefreshTokenPayload): Promise<void> {
        const { _id, token } = data;
        const _idResult = Validation.stringValidation(_id, '_id');
        const tokenResult = Validation.stringValidation(token, 'token');

        const updated = await AuthSchema.findOneAndUpdate(
            { _id: _idResult },
            { $set: { refreshToken: tokenResult } },
        );
        if (!updated) throw new Error('User not found');
    }

    static async deleteRefreshToken(data: AuthRefreshTokenPayload): Promise<void> {
        const { _id } = data;
        const _idResult = Validation.stringValidation(_id, '_id');

        const authObject = await AuthSchema.findOne({ _id: _idResult });
        if (!authObject) throw new Error('User not found');
        if (!authObject.refreshToken) throw new Error('Missing refresh token in cookies');

        await AuthSchema.findOneAndUpdate({ _id: _idResult }, { $unset: { refreshToken: '' } });
    }

    // Solo credenciales/autorización. name/foto se editan por SellerModel.edit
    static async editAuth(data: EditAuthPayload): Promise<void> {
        const { _id, email, password, role } = data;
        const _idResult = Validation.stringValidation(_id, '_id');

        const setFields: Partial<AuthSchemaType> = {};
        if (email !== undefined) setFields.email = Validation.email(email);
        if (password !== undefined) {
            // 🔧 Fix: antes se guardaba el password en texto plano, sin pasar por bcrypt
            setFields.password = await bcrypt.hash(Validation.password(password), SALT_ROUNDS);
        }
        if (role !== undefined) setFields.role = role;

        const updated = await AuthSchema.findOneAndUpdate({ _id: _idResult }, { $set: setFields });
        if (!updated) throw new Error('User not found');
    }
}