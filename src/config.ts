export const {
    PORT = 3000,
    ACCESS_SECRET = 'ember-shadow-echo-pulse-crystal-hawk-orbit-glide-spark-forest-vortex-flux-sunset-nova-mirror-logic',
    REFRESH_SECRET = 'lunar-thorn-blaze-cascade-echo-ripple-zenith-hollow-ember-quartz-surge-mirror-drift-aurora-pulse-vault',
} = process.env;

export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;