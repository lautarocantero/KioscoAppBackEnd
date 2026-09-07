# Guía de setup de Mercado Pago (membresías)

Guía paso a paso para dejar funcionando el cobro de membresías (`docs/Membership.md`) de
punta a punta: crear la app en Mercado Pago, conseguir cada credencial y saber exactamente
en qué archivo/panel va cada una. El código ya está escrito — usa la API de **Preapproval**
(suscripciones recurrentes), no Checkout Pro.

Entornos de este proyecto: backend local (`localhost:3000`) + backend en Render
(`kioscoappbackend.onrender.com`), frontend local (`localhost:5173`, default de Vite) +
frontend en Netlify.
Se recomienda separar credenciales **TEST** (local, sandbox) de **APP_USR** (producción,
plata real) — nunca mezclarlas.

---

## 1. Cuenta de cobro (collector)

Todo lo que se cobra por Preapproval llega a la cuenta de Mercado Pago dueña de las
credenciales usadas. Antes de crear la app:

1. Decidir/crear la cuenta de Mercado Pago Argentina que va a recibir el dinero de las
   suscripciones (puede ser una cuenta personal o de la empresa — la que corresponda
   fiscalmente al negocio).
2. Anotar en un lugar seguro (no en el repo): titular de la cuenta, CVU/alias para
   transferencias, y la periodicidad de liquidación de fondos (Mercado Pago liquida a la
   cuenta bancaria asociada según el plan de la cuenta — revisar en el panel de esa cuenta,
   sección "Tu dinero" / "Configuración de cobros").
3. Esto responde la tarea "Verificar a dónde va el dinero de las suscripciones" — quien
   tenga acceso a esa cuenta de Mercado Pago es quien puede retirar los fondos.

## 2. Crear la aplicación

1. Ingresar a https://www.mercadopago.com.ar/developers/panel/app con la cuenta del punto 1.
2. **Crear aplicación**.
3. Producto a integrar: **Suscripciones** (no "Pagos online"/Checkout Pro — el backend usa
   la API de Preapproval, `src/services/mercadoPagoService.ts:38-60`).
4. Modelo de integración: la que ofrezca el panel para suscripciones vía API (no necesita
   ningún checkout hospedado especial de MP más que el `init_point` que ya devuelve la API).

## 3. Credenciales de prueba (TEST)

En el panel de la app → pestaña **Credenciales de prueba**:

- **Access Token** (empieza con `TEST-...`) → va al backend.
- **Public Key** (empieza con `TEST-...`) → va al frontend.

Estas credenciales solo funcionan entre "usuarios de prueba" (ver punto 4), nunca con una
cuenta de Mercado Pago real.

## 4. Usuarios de prueba (paso que se saltea seguido y rompe todo)

Mercado Pago **no permite pagarse a uno mismo**: si el vendedor (dueño de las credenciales)
y el comprador son la misma cuenta, el pago se rechaza sin explicación clara.

1. En el panel → **Usuarios de prueba** → crear dos: uno rol **vendedor**, otro rol
   **comprador**. MP genera un email y contraseña ficticios para cada uno (son cuentas
   sandbox, no reciben mail real).
2. Las credenciales TEST del punto 3 tienen que salir de la app **asociada al vendedor de
   prueba** — si la app se creó con la cuenta real y no con el vendedor de prueba, hay que
   generar credenciales TEST desde ahí igual (el panel las asocia automáticamente al
   vendedor de prueba correspondiente).
3. **Para probar el checkout de Stocko**: registrar una cuenta nueva en Stocko usando el
   **email del comprador de prueba** (`membership.controller.ts:43` toma `payer_email` de
   `req.user.email` — no hay forma de pasar otro email al pagar).

## 5. Tarjetas de prueba

Con las credenciales TEST cargadas, usar estas tarjetas (Argentina) para forzar cada
resultado. El **número de tarjeta** no importa tanto como el **nombre del titular**, que es
lo que Mercado Pago usa en sandbox para decidir el resultado:

| Resultado | Titular a usar | Qué debería pasar en Stocko |
|---|---|---|
| Aprobado | `APRO` | Preapproval `authorized` → webhook → `plan_status: active` |
| Fondos insuficientes | `FUND` | Rechazo → Stocko muestra el mensaje genérico (`CARD_DECLINED_MESSAGE`) |
| Código de seguridad inválido | `SECU` | Rechazo | 
| Fecha de vencimiento inválida | `EXPI` | Rechazo |
| Rechazo genérico/otro motivo | `OTHE` | Rechazo |

Tarjeta de prueba sugerida: Mastercard `5031 7557 3453 0604`, cualquier CVV de 3 dígitos,
cualquier fecha futura. (Verificar en el panel de MP la lista vigente de números de tarjeta
de prueba por si cambian — el titular `APRO`/`FUND`/etc. es lo estable entre actualizaciones.)

## 6. Webhook

1. En el panel de la app → **Webhooks** → configurar notificaciones.
2. URL: `https://kioscoappbackend.onrender.com/membership/webhook` (producción) — para
   probar en local, ver "Probar el webhook en local" abajo.
3. Evento a suscribir: **Suscripciones** (`subscription_preapproval`) — es el único que
   consume `membership.controller.ts:73-76`.
4. Copiar la **clave secreta** que muestra el panel → `MP_WEBHOOK_SECRET`.

### Probar el webhook en local

Mercado Pago no puede llamar a `localhost`. Para recibir el webhook mientras se desarrolla
local, exponer el puerto 3000 con un túnel:

```bash
# opción A: Cloudflare (no requiere cuenta)
cloudflared tunnel --url http://localhost:3000

# opción B: ngrok
ngrok http 3000
```

Registrar la URL pública que da el túnel (`https://algo.trycloudflare.com/membership/webhook`
o similar) como webhook de prueba en el panel — se puede tener un webhook de prueba y uno de
producción a la vez.

## 7. Credenciales de producción (APP_USR)

Requiere activar la aplicación: completar los datos del negocio que pida el panel
(actividad, datos fiscales). Una vez activada, la pestaña **Credenciales de producción**
muestra Access Token y Public Key que empiezan con `APP_USR-...`.

**No usar credenciales de producción en local** — evita cobros reales accidentales durante
desarrollo.

---

## 8. Dónde va cada dato

| Dato | Local (TEST) | Producción (APP_USR) |
|---|---|---|
| Access Token | `KioscoAppBackEnd/.env` → `MP_ACCESS_TOKEN` | Render → Environment → `MP_ACCESS_TOKEN` |
| Clave secreta del webhook | `KioscoAppBackEnd/.env` → `MP_WEBHOOK_SECRET` | Render → Environment → `MP_WEBHOOK_SECRET` (usar la clave del webhook de **producción**, no la del túnel) |
| Public Key | `KioscoApp/.env` → `VITE_MP_PUBLIC_KEY` | Netlify → Site settings → Environment variables → `VITE_MP_PUBLIC_KEY` |
| URL del frontend | `KioscoAppBackEnd/.env` → `FRONTEND_URL=http://localhost:5173` | Render → Environment → `FRONTEND_URL=https://<tu-sitio>.netlify.app` |
| Entorno | `KioscoAppBackEnd/.env` → `NODE_ENV=development` | Render → Environment → `NODE_ENV=production` |

Notas:

- `FRONTEND_URL` se usa como `back_url` de la preapproval
  (`mercadoPagoService.ts:46`) — a dónde vuelve el usuario después de pagar en el checkout
  hospedado. Si queda mal seteado en Render, el usuario termina el pago viendo localhost.
- `NODE_ENV=production` en Render importa además para la seguridad del webhook: si
  `MP_WEBHOOK_SECRET` faltara, el backend **rechaza** el webhook en vez de aceptar
  notificaciones sin firma (`mercadoPagoService.ts:75-87`).
- El `.env` del frontend se carga en todos los modos de Vite (dev y build), así que
  `VITE_MP_PUBLIC_KEY` puesta ahí alcanza para desarrollo local. En Netlify, **no** se sube
  ningún `.env` (está gitignoreado) — la Public Key de producción se carga como variable de
  entorno del sitio, que Vite toma en build time igual que si viniera de un archivo.
- Ninguna credencial de Mercado Pago (Access Token, clave del webhook, Public Key) se
  commitea nunca — todas viven en `.env` (gitignoreado) o en el panel del hosting. Usar
  `.env.example` como plantilla de qué variables hacen falta, sin valores.

## 9. Después de cargar las credenciales

```bash
cd KioscoAppBackEnd
npm run migrate:membership-plans   # backfillea plan/plan_status en cuentas existentes (idempotente)
npm run dev
```

Sin este paso, cuentas creadas antes del feature de membresías no tienen `plan`/`plan_status`
y `GET /membership/status` puede fallar la validación Zod del frontend.

## 10. Checklist de QA antes de dar por cerrado

- [ ] Checkout redirect: crear preapproval, pagar con `APRO`, confirmar que el webhook deja
      `plan_status: active` en Mongo (no solo en la UI).
- [ ] Checkout con tarjeta (Card Payment Brick): mismo resultado, y confirmar que ningún log
      muestra el `card_token_id`.
- [ ] Rechazos: `FUND`, `SECU`, `OTHE` → el usuario ve el mensaje genérico, no el error crudo
      del SDK de Mercado Pago.
- [ ] Tras crear el checkout y antes de que llegue el webhook, el plan queda en
      `pending_payment` (nunca `active` de entrada).
- [ ] Cancelar la suscripción desde el panel de MP → el webhook baja la cuenta a
      `standard` / `cancelled`.
- [ ] `POST /membership/webhook` con una firma inválida devuelve **401**.
- [ ] Reenviar el mismo webhook dos veces no duplica ningún efecto.

Dos cosas a resolver antes o durante este QA (no son de configuración, son de lógica de
negocio — ver `docs/tasks.md`):

- Toda cuenta nueva nace con `plan: 'standard'` y `plan_status: 'active'`, pero Standard
  tiene precio ($49.900) — el checkout rechaza re-suscribirse a un plan ya activo, así que
  hoy **nadie puede contratar Standard pagando**. Definir si Standard debería ser el tier
  gratuito o si el estado inicial de una cuenta nueva no debería ser `active`.
- El ciclo de facturación semestral (que sí existe en el frontend) no llega al backend: la
  suscripción se crea siempre mensual (`mercadoPagoService.ts:52-56`) y hay un solo precio
  por plan. Si se quiere ofrecer semestral de verdad, hace falta sumar esa lógica al backend
  antes de poder probarla.
