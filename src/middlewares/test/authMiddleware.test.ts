import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../authMiddleware';
import { ACCESS_SECRET } from '../../config';

const buildRes = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('authMiddleware', () => {
  it('responde 401 si no hay cookie access_token', () => {
    const req = { cookies: {} } as Request;
    const res = buildRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 401 si el token es inválido o expiró', () => {
    const req = { cookies: { access_token: 'token-trucho' } } as unknown as Request;
    const res = buildRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired access token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 401 si el token fue firmado con otro secreto', () => {
    const forgedToken = jwt.sign({ id: '1', email: 'a@a.com' }, 'otro-secreto');
    const req = { cookies: { access_token: forgedToken } } as unknown as Request;
    const res = buildRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('setea req.user y llama a next() con un token válido', () => {
    const validToken = jwt.sign({ id: 'user-1', email: 'user@stocko.com' }, ACCESS_SECRET);
    const req = { cookies: { access_token: validToken } } as unknown as Request;
    const res = buildRes();
    const next: NextFunction = vi.fn();

    authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: 'user-1', email: 'user@stocko.com' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('ignora campos extra del payload y solo copia id/email a req.user', () => {
    const validToken = jwt.sign(
      { id: 'user-1', email: 'user@stocko.com', role: 'admin' },
      ACCESS_SECRET
    );
    const req = { cookies: { access_token: validToken } } as unknown as Request;
    const res = buildRes();
    const next: NextFunction = vi.fn();

    authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: 'user-1', email: 'user@stocko.com' });
  });
});
