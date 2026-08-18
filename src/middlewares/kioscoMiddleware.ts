import { Request, Response, NextFunction } from 'express';
import { KioscoModel } from '../models/kioscoModel';
// Import relativo (no @typings): acá se usa como VALOR (AuthRoleEnum[]),
// y el alias solo resuelve en tiempo de compilación, no en runtime (ts-node-dev).
import { AuthRoleEnum } from '../typings/auth/enums';

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🏪 Middleware de scoping por kiosco 🏪                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ 📥 Entrada: header x-kiosco-id + req.user (ya seteado por authMiddleware)  ║
║ ⚙️ Proceso: valida que el usuario pertenezca a ese kiosco                  ║
║ 📤 Salida: req.kioscoId + req.kioscoRole, o 400/403                        ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

declare global {
  namespace Express {
    interface Request {
      kioscoId?: string;
      kioscoRole?: AuthRoleEnum;
    }
  }
}

export async function requireKioscoContext(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Rutas propias de /kiosco/:kiosco_id usan el param; el resto (product, sell, etc.)
  // no tiene kiosco_id en la URL, así que viaja como header en cada request.
  const kioscoId = req.params.kiosco_id ?? req.headers['x-kiosco-id'];

  if (!kioscoId || typeof kioscoId !== 'string') {
    res.status(400).json({ message: 'Missing kiosco context (x-kiosco-id header or kiosco_id param)' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const membership = await KioscoModel.getMembership(kioscoId, req.user.id);
    if (!membership) {
      res.status(403).json({ message: 'You do not belong to this kiosco' });
      return;
    }

    req.kioscoId = kioscoId;
    req.kioscoRole = membership.role;
    next();
  } catch (error: unknown) {
    res.status(500).json({ message: 'Failed to resolve kiosco membership' });
  }
}

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🎭 requireKioscoRole 🎭 → Guard de autorización por rol dentro del kiosco  ║
║    activo (usar después de requireKioscoContext)                          ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export function requireKioscoRole(allowedRoles: AuthRoleEnum[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.kioscoRole) {
      res.status(401).json({ message: 'Missing kiosco context' });
      return;
    }
    if (!allowedRoles.includes(req.kioscoRole)) {
      res.status(403).json({ message: 'Insufficient permissions in this kiosco' });
      return;
    }
    next();
  };
}
