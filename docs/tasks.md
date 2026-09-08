## 🗂️ To-Do / Roadmap

El bloque de Mercado Pago (credenciales) está separado al final bajo "Fase final" porque depende de un paso manual externo, no de código.

---

### Membresías

- [ xxx ] **Cuenta nueva nace con Standard activo (gratis).**

  `AuthMongoSchema` (src/schemas/authSchema.ts:18-29) define `plan: 'standard'` + `plan_status: 'active'` por defecto, pese a que Standard tiene precio ($49.900).

  El checkout rechaza re-suscribirse a un plan ya activo, así que ninguna cuenta nueva puede *contratar* Standard pagando — lo tiene gratis desde el registro.

  Falta decidir el estado inicial real (`plan_status: 'inactive'`, o un plan `free` separado) y ajustar el gating que hoy asume `active`. Decisión de negocio + código.

- [ xxx ] **Ciclo semestral no existe en el backend.**

  `mercadoPagoService.ts:52-56` crea siempre la preapproval con `auto_recurring: { frequency: 1, frequency_type: 'months' }` hardcodeado, sin importar lo que elija el frontend (`BillingPeriodToggle.tsx`, `KioscoPlanBillingPeriod.Semiannual`).

  Falta propagar el `billing_period` elegido hasta `createPreapproval` y mapear `Semiannual` a `{ frequency: 6, frequency_type: 'months' }` con el precio semestral correspondiente.

---

### Ventas

- [ xxx ] **`createSell` sin transacción Mongo.**

  La venta se crea ANTES de descontar stock de presentaciones (`sell.controller.ts:274-292`), y `decreaseStock` (`presentationModel.ts:163-201`) es un loop read-then-write por ítem — no usa `$inc` atómico ni guard `{ stock: { $gte: stock_required } }`.

  Riesgos:
  1. Carrera entre vendedores concurrentes puede dejar stock negativo pese al chequeo previo, porque check-then-act no es atómico.
  2. Si falla a mitad del loop, los ítems ya procesados quedan descontados y el resto no → corrupción parcial de stock.

  Fix: reescribir `decreaseStock` con `$inc` + guard condicional, y envolver create+decreaseStock en `mongoose.startSession()`/transaction.

---

### Seguridad

- [ xxx ] **Falta `helmet` en el backend.**

  `src/index.ts` solo monta `cors`, `express.json`/`urlencoded` y `cookieParser` — sin headers de seguridad (HSTS, X-Frame-Options, X-Content-Type-Options/noSniff, CSP). `helmet` no está en `package.json`.

  Cuidado con `/api-docs`: swagger-ui puede necesitar CSP relajada.

  Ver `KioscoApp/docs/usefull/securityAudit.md`.

---

### Testing

- [ xxx ] **Cerrando huecos de cobertura restantes** (dinero primero):
  1. `src/services/*.ts` — capa entera sin tests: `mercadoPagoService`, `catalogService`, `monthlyReportService`, `planService`, `emailService`, `presentationAnalysticsService`; más las funciones sin cubrir de `receiptImportService.ts` (`matchPresentations`, `confirmReceiptImport`, `applyReceiptDocs`).
  2. `productModel.ts` / `sellModel.ts`.
  3. Middlewares `kioscoMiddleware.ts` / `rateLimitMiddleware.ts`.

---

## ⛔ Fase final — depende de cuentas/servicios externos (post-desarrollo)

### Membresías (bloqueado por credenciales de Mercado Pago)

- [ xxx ] **Configurar credenciales reales de Mercado Pago.**

  `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET` en el backend, `VITE_MP_PUBLIC_KEY` en el frontend (KioscoApp).

  Sin esto ningún checkout de membresía cobra de verdad (ni redirect ni tarjeta con Card Payment Brick) — `POST /membership/checkout` devuelve 400.

  Falta que se cree la app en el panel de Mercado Pago y se carguen las credenciales reales — paso manual del dueño de la cuenta.

  Guía completa en `docs/MercadoPagoSetup.md`. Cuando haya credenciales, correr el checklist de QA de `MercadoPagoSetup.md §10`.
