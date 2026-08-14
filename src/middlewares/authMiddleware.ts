import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ACCESS_SECRET } from '../config';
import { AuthRoleEnum } from '@typings/auth/enums';

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🛡️ Middleware de autenticación/autorización 🛡️                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ 📥 Entrada: cookie access_token                                            ║
║ ⚙️ Proceso: verifica el JWT firmado en login/refresh                       ║
║ 📤 Salida: req.user = { id, email, role } o 401                            ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: AuthRoleEnum;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const accessToken = req.cookies?.access_token;

  if (!accessToken) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const payload = jwt.verify(accessToken, ACCESS_SECRET) as AuthenticatedUser;
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch (error: unknown) {
    res.status(401).json({ message: 'Invalid or expired access token' });
  }
}

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🎭 requireRole 🎭 → Guard de autorización por rol (usar después de         ║
║    authMiddleware, ya que depende de req.user)                             ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export function requireRole(allowedRoles: AuthRoleEnum[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}