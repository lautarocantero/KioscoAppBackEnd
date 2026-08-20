export const {
    PORT = 3000,
    ACCESS_SECRET = 'ember-shadow-echo-pulse-crystal-hawk-orbit-glide-spark-forest-vortex-flux-sunset-nova-mirror-logic',
    REFRESH_SECRET = 'lunar-thorn-blaze-cascade-echo-ripple-zenith-hollow-ember-quartz-surge-mirror-drift-aurora-pulse-vault',
    RESEND_API_KEY,
    EMAIL_FROM = 'Stocko <onboarding@resend.dev>',
    FRONTEND_URL = 'http://localhost:5173',
    // Opcionales: sin ellas el checkout de membresías responde 400 en vez de
    // tirar abajo todo el server (a diferencia de RESEND_API_KEY, que sí es
    // crítico desde el arranque). Ver services/mercadoPagoService.ts.
    MP_ACCESS_TOKEN,
    MP_WEBHOOK_SECRET,
} = process.env;

export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY in .env');