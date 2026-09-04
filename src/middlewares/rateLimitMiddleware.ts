import { rateLimit } from 'express-rate-limit';

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🚦 Rate limiting para endpoints públicos sensibles 🚦                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ 📥 Entrada: -                                                              ║
║ ⚙️ Proceso: cuenta requests por IP en una ventana de tiempo                ║
║ 📤 Salida: 429 si se supera el límite, next() si no                       ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

// login/register/request-password-reset son los 3 endpoints típicos de
// credential stuffing y fuerza bruta (ver docs/usefull/securityAudit.md,
// repo KioscoApp). No hay lockout/CAPTCHA del lado del cliente a propósito
// (no es confiable), así que la protección real vive acá.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});
