## 🗂️ To-Do / Roadmap

**Orden de fases (2026-09-07):** el foco ahora es terminar la aplicación — los bloques de abajo son código puro, sin cuentas ni servicios de por medio. El bloque de Mercado Pago (credenciales) quedó separado al final bajo "fase final", ver el marcador.

---
general:

---
membresías (código, ejecutable ahora):
- [ xxx ] Cuenta nueva nace ya "Standard activo": AuthMongoSchema (src/schemas/authSchema.ts:18-29)
          define `plan: 'standard'` + `plan_status: 'active'` por defecto, pese a que Standard
          tiene precio ($49.900). El checkout rechaza re-suscribirse a un plan ya activo, así que
          ninguna cuenta nueva puede *contratar* Standard pagando — lo tiene gratis desde el
          registro. Requiere decidir el estado inicial real (`plan_status: 'inactive'`, o un plan
          `free` separado) y ajustar el gating que hoy asume `active`. Decisión de negocio +
          código.
- [ xxx ] Ciclo semestral no existe en el backend: mercadoPagoService.ts:52-56 crea siempre la
          preapproval con `auto_recurring: { frequency: 1, frequency_type: 'months' }`
          hardcodeado, sin importar lo que elija el frontend (BillingPeriodToggle.tsx,
          KioscoPlanBillingPeriod.Semiannual). Falta propagar el `billing_period` elegido hasta
          `createPreapproval` y mapear `Semiannual` a `{ frequency: 6, frequency_type: 'months' }`
          con el precio semestral correspondiente (el frontend ya anuncia 15% menos por mes).

---
ventas:
- [ xxx ] Envolver createSell en transacción Mongo (session): actualmente la venta se crea
          ANTES de descontar stock de presentaciones (sell.controller.ts:274-292). Si
          decreaseStock falla (stock insuficiente, carrera entre vendedores), la venta queda
          guardada igual y el stock no se descuenta → inconsistencia entre "sells" y
          "presentations". Ideal: validar/reservar stock antes de crear la venta, o
          mongoose.startSession() + transaction con rollback de ambas operaciones.
          Verificado (2026-09-07), más grave de lo que decía la descripción original:
          decreaseStock (presentationModel.ts:163-201) es un loop read-then-write por cada
          ítem de la venta (findOne del stock actual, calcula newStock en JS, recién ahí
          findOneAndUpdate) — no usa $inc atómico ni un filtro de guarda tipo
          { stock: { $gte: stock_required } }. Dos consecuencias que la transacción sola no
          resuelve: (1) carrera entre vendedores concurrentes vendiendo la misma presentación
          puede dejar stock negativo pese al chequeo de la línea 175, porque el check-then-act
          no es atómico; (2) si decreaseStock falla a mitad del loop (ítem 3 de 5, por
          ejemplo), los ítems 1-2 ya quedaron descontados en DB y los 3-5 no — corrupción
          parcial de stock, no solo el desfasaje venta↔stock ya documentado. Para cerrar (1)
          hace falta además reescribir el update con $inc + guard condicional
          (findOneAndUpdate con filtro { stock: { $gte: stock_required } }), la transacción
          por sí sola no lo evita.

---
seguridad:
- [ xxx ] Agregar `helmet` al backend: src/index.ts (KioscoAppBackEnd) solo monta `cors`,
          `express.json`/`urlencoded` y `cookieParser`, sin ningún middleware de headers de
          seguridad (HSTS, X-Frame-Options, X-Content-Type-Options/noSniff,
          Content-Security-Policy). `helmet` no está en package.json. No estaba anotado como
          pendiente en ningún documento pese a mencionarse de pasada en securityAudit.md —
          confirmado 2026-09-07. Cuidado con `/api-docs` (swagger-ui puede necesitar CSP
          relajada). Ver detalle en KioscoApp/docs/usefull/securityAudit.md.

---
testing:
- [ xxx ] Cerrado (2026-09-07): todos los controllers/models del backend ya tienen tests —
          de 9 archivos / 113 tests a **24 archivos / 360 tests**. Orden en que se cerró
          (dinero/cuentas primero): `auth.controller`/`authModel` (36+23 tests: register/login/
          Google/reset/verify/delete/edit, mockeando AuthSchema/SellerSchema/
          KioscoMembershipSchema y una sesión Mongo fake para las transacciones de
          `create`/`deleteAuth`) y `membership.controller`/`membershipModel` (19+12 tests:
          checkout redirect/tarjeta, rechazo de tarjeta con mensaje genérico, webhook idempotente
          y out-of-order). Después, sin prioridad de dinero: `seller`, `notification`, `receipt`
          (mockeando `receiptImportService` y el memory storage de `multer`), `provider`,
          `kiosco` (incluye los límites por plan de `create`/`join` y las excepciones Deluxe) y
          `presentation` (incluye `decreaseStock` — el método con el problema de atomicidad
          documentado en la sección "ventas" de arriba; los tests fijan el comportamiento
          *actual*, no atómico, como base para verificar la futura corrección). De paso
          `controllerTestUtils.ts` (`buildRes`) ahora también mockea `cookie`/`clearCookie`,
          necesarios para testear login/logout/refresh.
          **Nota para quien siga escribiendo tests de modelos con `mockResolvedValueOnce`:**
          si el código bajo test tiene un branch que a veces SALTEA una llamada (ej. plan sin
          límite → nunca llama a `getUnitCount`), un `mockResolvedValueOnce` puesto para esa
          rama queda sin consumir y se filtra al test siguiente que sí llama a esa función,
          rompiéndolo de forma no obvia (ver el fix en `presentationModel.test.ts`, describe
          `create`). Solo encolar `mockResolvedValueOnce` en la rama que efectivamente invoca
          esa función.
          Sigue sin cubrir: `receiptImportService.ts` más allá de sus helpers puros
          (`matchPresentations`, `confirmReceiptImport`, `applyReceiptDocs` no tienen test
          directo), `productModel.ts`/`sellModel.ts` (solo sus controllers están cubiertos, vía
          mocks) y los middlewares `kioscoMiddleware`/`rateLimitMiddleware` (solo `authMiddleware`
          tiene test). Ninguno toca dinero/cuentas directamente — menor prioridad.

---
## ⛔ Fase final — depende de cuentas/servicios externos (post-desarrollo)

---
membresías (bloqueado por credenciales de Mercado Pago):
- [ xxx ] Configurar credenciales reales de Mercado Pago: MP_ACCESS_TOKEN y
          MP_WEBHOOK_SECRET en el backend, VITE_MP_PUBLIC_KEY en el frontend
          (KioscoApp). Sin esto ningún checkout de membresía cobra de verdad
          (ni el flujo redirect ni el de tarjeta con Card Payment Brick) —
          POST /membership/checkout devuelve 400 y el pago con tarjeta muestra
          "no disponible". Guía completa de setup en docs/MercadoPagoSetup.md
          (nueva, 2026-09-07): cómo crear la app en Mercado Pago, usuarios y
          tarjetas de prueba, y tabla de qué credencial va en qué .env/panel
          de hosting (local TEST vs. Render/Netlify APP_USR).
          Sigue bloqueado: falta que se cree la aplicación en el panel de
          Mercado Pago y se carguen las credenciales reales — no depende de
          código, es un paso manual del dueño de la cuenta.
          Cerrado en esta sesión (2026-09-07):
          (1) mercadoPagoService.ts:75-87 ahora es fail-closed en producción
          — si falta MP_WEBHOOK_SECRET y NODE_ENV=production, el webhook se
          rechaza en vez de saltar la validación de firma (antes, cualquiera
          que conociera la URL podía simular una confirmación de pago
          mientras la var siguiera vacía). En desarrollo se mantiene el
          warning para no bloquear el trabajo local. Requiere que Render
          tenga NODE_ENV=production seteado explícitamente (ver .env.example).
          (2) Se agregó FRONTEND_URL al .env (antes ausente, corría con el
          default localhost:5173 de config.ts:7, que es el back_url que
          recibiría toda preapproval creada desde Render).
          (3) Se agregaron .env.example en ambos repos (no existía ninguno).
          Pendiente real para cuando haya credenciales: correr el checklist
          de QA de MercadoPagoSetup.md §10. Los dos hallazgos de lógica de
          negocio que antes estaban anotados acá (plan Standard no
          contratable, ciclo semestral sin backend) son código puro y se
          movieron al bloque "membresías (código, ejecutable ahora)" arriba
          — no dependen de las credenciales.
---
