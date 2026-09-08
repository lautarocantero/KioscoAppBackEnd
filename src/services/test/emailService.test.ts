import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock('resend', () => {
    class Resend {
        emails = { send: mockSend };
    }
    return { Resend };
});

vi.mock('../../config', () => ({
    RESEND_API_KEY: 'test-resend-key',
    EMAIL_FROM: 'Stocko <onboarding@resend.dev>',
    FRONTEND_URL: 'http://localhost:5173',
}));

import { EmailService } from '../emailService';

describe('EmailService.sendVerificationEmail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('envía el mail con el link de verificación armado a partir del token', async () => {
        mockSend.mockResolvedValueOnce({ error: null });

        await EmailService.sendVerificationEmail({ to: 'user@test.com', username: 'Lautaro', token: 'tok-123' });

        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            from: 'Stocko <onboarding@resend.dev>',
            to: 'user@test.com',
            subject: 'Confirmá tu cuenta en Stocko',
            html: expect.stringContaining('http://localhost:5173/verify-email?token=tok-123'),
        }));
        expect(mockSend.mock.calls[0][0].html).toContain('Lautaro');
    });

    it('lanza si Resend devuelve error', async () => {
        mockSend.mockResolvedValueOnce({ error: { message: 'invalid API key' } });

        await expect(EmailService.sendVerificationEmail({ to: 'user@test.com', username: 'Lautaro', token: 'tok-123' }))
            .rejects.toThrow('Failed to send verification email: invalid API key');
    });
});

describe('EmailService.sendPasswordResetEmail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('envía el mail con el link de reset armado a partir del token', async () => {
        mockSend.mockResolvedValueOnce({ error: null });

        await EmailService.sendPasswordResetEmail({ to: 'user@test.com', username: 'Lautaro', token: 'tok-456' });

        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            to: 'user@test.com',
            subject: 'Restablecer tu contraseña en Stocko',
            html: expect.stringContaining('http://localhost:5173/reset-password?token=tok-456'),
        }));
    });

    it('lanza si Resend devuelve error', async () => {
        mockSend.mockResolvedValueOnce({ error: { message: 'rate limited' } });

        await expect(EmailService.sendPasswordResetEmail({ to: 'user@test.com', username: 'Lautaro', token: 'tok-456' }))
            .rejects.toThrow('Failed to send password reset email: rate limited');
    });
});
