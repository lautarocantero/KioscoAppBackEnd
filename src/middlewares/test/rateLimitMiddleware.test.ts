import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { authRateLimiter } from '../rateLimitMiddleware';

/*
 * authRateLimiter es una instancia real de express-rate-limit (no se mockea:
 * es la única forma de verificar que la config — windowMs/limit/headers —
 * realmente limita). Corre contra su MemoryStore interno, compartido por
 * TODO este archivo de test (se crea una sola vez al importar el módulo) —
 * por eso cada test usa una IP distinta, para no pisarse el contador entre sí.
 */

const buildReq = (ip: string): Request => ({
    ip,
    app: { get: () => undefined },
    headers: {},
    originalUrl: '/auth/login',
} as unknown as Request);

const buildRes = (): Response => {
    const res = {} as Response;
    res.headersSent = false;
    res.writableEnded = false;
    res.setHeader = vi.fn().mockReturnValue(res);
    res.status = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
};

async function hit(ip: string): Promise<{ res: Response; next: NextFunction }> {
    const req = buildReq(ip);
    const res = buildRes();
    const next: NextFunction = vi.fn();
    await authRateLimiter(req, res, next);
    return { res, next };
}

describe('authRateLimiter', () => {
    it('permite hasta el límite (10) de requests por IP', async () => {
        for (let i = 0; i < 10; i += 1) {
            const { res, next } = await hit('10.0.1.1');
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        }
    });

    it('bloquea con 429 y el mensaje configurado al superar el límite', async () => {
        const ip = '10.0.2.1';
        for (let i = 0; i < 10; i += 1) await hit(ip);

        const { res, next } = await hit(ip);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.send).toHaveBeenCalledWith({ message: 'Too many attempts, please try again later' });
        expect(next).not.toHaveBeenCalled();
    });

    it('lleva un contador independiente por IP: una IP nueva no es afectada por otra ya bloqueada', async () => {
        const blockedIp = '10.0.3.1';
        for (let i = 0; i < 11; i += 1) await hit(blockedIp); // la deja bloqueada

        const { res, next } = await hit('10.0.3.2');

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('setea headers estándar (RateLimit-*) y no los legacy (X-RateLimit-*)', async () => {
        const { res } = await hit('10.0.4.1');

        expect(res.setHeader).toHaveBeenCalledWith('RateLimit-Limit', expect.any(String));
        expect(res.setHeader).not.toHaveBeenCalledWith('X-RateLimit-Limit', expect.anything());
    });
});
