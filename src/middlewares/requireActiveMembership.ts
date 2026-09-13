import { Request, Response, NextFunction } from 'express';
import { PlanService } from '../services/planService';
import { KioscoPlanStatusEnum } from '../typings/membership/enums';

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🚧 Middleware de gating de membresía 🚧                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ 📥 Entrada: req.user (ya seteado por authMiddleware, va después de él)     ║
║ ⚙️ Proceso: resuelve el estado de plan de la cuenta (PlanService, que ya   ║
║    aplica el vencimiento perezoso del trial) y solo deja pasar si está     ║
║    Active o en Trial vigente.                                             ║
║ 📤 Salida: next() o 402 { code: 'MEMBERSHIP_REQUIRED' }                    ║
║                                                                             ║
║ Se monta en los routers de negocio (kiosco, product, sell, presentation,  ║
║ receipt) — NUNCA en auth/membership (incluido el webhook), que deben      ║
║ seguir accesibles para que la cuenta pueda pagar y desbloquearse.         ║
║                                                                             ║
║ ⚠️ Nota conocida: durante un checkout redirect, plan_status pasa a         ║
║ pending_payment hasta que el webhook confirme, así que la cuenta queda    ║
║ bloqueada por esa ventana corta. Aceptado por ahora (ver plan/roadmap).   ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export async function requireActiveMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const { plan_status, trial_ends_at } = await PlanService.getMembershipState(req.user.id);

  const trialActive = plan_status === KioscoPlanStatusEnum.Trial
    && trial_ends_at !== null
    && trial_ends_at.getTime() > Date.now();

  if (plan_status === KioscoPlanStatusEnum.Active || trialActive) {
    next();
    return;
  }

  res.status(402).json({
    code: 'MEMBERSHIP_REQUIRED',
    message: 'Tu prueba gratuita terminó o tu suscripción no está activa. Elegí un plan para continuar.',
    plan_status,
  });
}
