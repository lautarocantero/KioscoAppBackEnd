import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ACCESS_SECRET } from '../config';

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🛡️ Middleware de autenticación 🛡️                                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ 📥 Entrada: cookie access_token                                            ║
║ ⚙️ Proceso: verifica el JWT firmado en login/refresh                       ║
║ 📤 Salida: req.user = { id, email } o 401                                  ║
║                                                                             ║
║ 🔀 El rol ya no vive acá: es por-kiosco (KioscoMembership), no global.     ║
║    Ver requireKioscoRole en kioscoMiddleware.ts.                           ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export interface AuthenticatedUser {
  id: string;
  email: string;
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
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (error: unknown) {
    res.status(401).json({ message: 'Invalid or expired access token' });
  }
}
