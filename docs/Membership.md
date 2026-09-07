# Membresías (planes de kiosco) + Mercado Pago

Cada kiosco tiene un tier de suscripción (`plan`) con 2 niveles: `standard` (default,
sin costo hasta que se hace upgrade) y `deluxe`. El upgrade se paga como una
suscripción mensual recurrente en Mercado Pago (API de
[Preapproval](https://www.mercadopago.com.ar/developers/es/docs/subscriptions/landing)).

## Setup

Guía completa (crear la app en Mercado Pago, usuarios/tarjetas de prueba, dónde va cada
credencial en local vs. producción, checklist de QA): ver
[`MercadoPagoSetup.md`](./MercadoPagoSetup.md).

Resumen:

1. Crear una aplicación en https://www.mercadopago.com.ar/developers/panel/app
2. Copiar el **Access Token** (de prueba o de producción) a `MP_ACCESS_TOKEN` en `.env`.
3. En la sección "Webhooks" de la app, dar de alta la URL `<tu backend>/membership/webhook`
   suscripta al evento `subscription_preapproval`, y copiar la **clave secreta** a
   `MP_WEBHOOK_SECRET`.
4. Sin `MP_ACCESS_TOKEN`, `POST /membership/checkout` responde 400 pero el resto del
   servidor sigue funcionando normalmente.
5. Sin `MP_WEBHOOK_SECRET`, el webhook rechaza la notificación en producción
   (`NODE_ENV=production`, fail-closed); en desarrollo no valida la firma y deja un warning
   en el log — configurar el secret antes de ir a producción.
6. **Kioscos creados antes de este feature**: correr `npm run migrate:membership-plans`
   una vez — backfillea `plan: 'standard'`, `plan_status: 'active'` en los kioscos que no
   tienen esos campos todavía (Mongoose `default` solo aplica a documentos nuevos).
   Idempotente. Sin esto, `GET /membership/status` devuelve un kiosco sin `plan`, y la
   validación Zod del frontend lo rechaza.
7. Para el pago con tarjeta (sin redirect, ver abajo): copiar la **Public Key** (de
   prueba o de producción) a `VITE_MP_PUBLIC_KEY` en el `.env` del **frontend** — el
   frontend la usa para inicializar el Card Payment Brick. Es una clave pública, segura
   de exponer client-side (no confundir con `MP_ACCESS_TOKEN`, que es secreta).

## Endpoints (`/membership`)

| Método | Ruta         | Auth                                  | Descripción                                   |
|--------|--------------|----------------------------------------|------------------------------------------------|
| GET    | `/plans`     | `authMiddleware`                       | Precio/moneda de los 2 tiers                    |
| GET    | `/status`    | `authMiddleware` + kiosco context      | Plan/estado actual del kiosco activo            |
| POST   | `/checkout`  | `authMiddleware` + kiosco context, admin | Crea la suscripción en Mercado Pago (`payment_method: 'redirect' \| 'card'`) |
| POST   | `/webhook`   | firma HMAC de Mercado Pago             | Recibe la notificación y actualiza el plan del kiosco |

## Flujo

1. El admin del kiosco elige un tier en Configuración → Membresía (frontend), y un
   método de pago: **Mercado Pago** (redirect) o **Tarjeta de crédito** (Card Payment
   Brick, sin salir de la app).
2. **Redirect**: el frontend llama `POST /membership/checkout { plan, payment_method:
   'redirect' }`; el backend crea una `preapproval` en Mercado Pago (`auto_recurring`
   mensual, `status: 'pending'`) con `external_reference = "<user_id>:<plan>"` y
   devuelve `init_point`. El frontend redirige ahí (checkout hospedado por Mercado
   Pago).
3. **Tarjeta**: el frontend tokeniza la tarjeta client-side con el Card Payment Brick
   (`@mercadopago/sdk-react`) — el número/CVV nunca llegan a nuestro backend, solo un
   `card_token_id` de un solo uso. El frontend llama `POST /membership/checkout {
   plan, payment_method: 'card', card_token_id }`; el backend crea la `preapproval` ya
   con `status: 'authorized'` y ese `card_token_id` (sin `init_point`, no hay redirect).
   `card_token_id` no se loguea en ningún punto del flujo.
4. En ambos casos, el backend marca el plan como `pending_payment` apenas se crea la
   preapproval — **nunca** lo marca `active` a partir de la respuesta síncrona de este
   endpoint (ni siquiera si Mercado Pago ya la devolvió `authorized`). La única fuente
   de verdad de que el plan quedó activo es el webhook firmado.
5. Mercado Pago notifica `POST /membership/webhook` cuando la suscripción queda
   `authorized` (o `cancelled`). El backend relee la preapproval, y actualiza
   `Kiosco.plan` / `Kiosco.plan_status` según corresponda. Una preapproval cancelada
   hace caer al kiosco de vuelta al tier `standard`.
6. Un rechazo de tarjeta (ej. fondos insuficientes) al crear la preapproval devuelve un
   mensaje genérico al cliente ("Tu tarjeta fue rechazada...") en vez del error crudo
   de la API de Mercado Pago, para no filtrar detalles internos del procesador.

## Límites por tier

Ver `src/config/planLimits.ts` para los límites concretos de `standard` (vendedores,
kioscos propios, unidades de catálogo, alcance de reportes/historial) y su
enforcement en los modelos correspondientes. `deluxe` no tiene límites.
