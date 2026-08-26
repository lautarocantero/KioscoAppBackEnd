# Membresías (planes de kiosco) + Mercado Pago

Cada kiosco tiene un tier de suscripción (`plan`) con 2 niveles: `standard` (default,
sin costo hasta que se hace upgrade) y `deluxe`. El upgrade se paga como una
suscripción mensual recurrente en Mercado Pago (API de
[Preapproval](https://www.mercadopago.com.ar/developers/es/docs/subscriptions/landing)).

## Setup

1. Crear una aplicación en https://www.mercadopago.com.ar/developers/panel/app
2. Copiar el **Access Token** (de prueba o de producción) a `MP_ACCESS_TOKEN` en `.env`.
3. En la sección "Webhooks" de la app, dar de alta la URL `<tu backend>/membership/webhook`
   suscripta al evento `subscription_preapproval`, y copiar la **clave secreta** a
   `MP_WEBHOOK_SECRET`.
4. Sin `MP_ACCESS_TOKEN`, `POST /membership/checkout` responde 400 pero el resto del
   servidor sigue funcionando normalmente.
5. Sin `MP_WEBHOOK_SECRET`, el webhook no valida la firma (queda un warning en el log) —
   configurarlo antes de ir a producción.
6. **Kioscos creados antes de este feature**: correr `npm run migrate:membership-plans`
   una vez — backfillea `plan: 'standard'`, `plan_status: 'active'` en los kioscos que no
   tienen esos campos todavía (Mongoose `default` solo aplica a documentos nuevos).
   Idempotente. Sin esto, `GET /membership/status` devuelve un kiosco sin `plan`, y la
   validación Zod del frontend lo rechaza.

## Endpoints (`/membership`)

| Método | Ruta         | Auth                                  | Descripción                                   |
|--------|--------------|----------------------------------------|------------------------------------------------|
| GET    | `/plans`     | `authMiddleware`                       | Precio/moneda de los 2 tiers                    |
| GET    | `/status`    | `authMiddleware` + kiosco context      | Plan/estado actual del kiosco activo            |
| POST   | `/checkout`  | `authMiddleware` + kiosco context, admin | Crea la suscripción en Mercado Pago y devuelve `init_point` (URL de checkout) |
| POST   | `/webhook`   | firma HMAC de Mercado Pago             | Recibe la notificación y actualiza el plan del kiosco |

## Flujo

1. El admin del kiosco elige un tier en Configuración → Membresía (frontend).
2. El frontend llama `POST /membership/checkout { plan }`; el backend crea una
   `preapproval` en Mercado Pago (`auto_recurring` mensual) con
   `external_reference = "<kiosco_id>:<plan>"` y marca el kiosco como `pending_payment`.
3. El frontend redirige al `init_point` devuelto (checkout hospedado por Mercado Pago).
4. Mercado Pago notifica `POST /membership/webhook` cuando la suscripción queda
   `authorized` (o `cancelled`). El backend relee la preapproval, y actualiza
   `Kiosco.plan` / `Kiosco.plan_status` según corresponda. Una preapproval cancelada
   hace caer al kiosco de vuelta al tier `standard`.

## Límites por tier

Ver `src/config/planLimits.ts` para los límites concretos de `standard` (vendedores,
kioscos propios, unidades de catálogo, alcance de reportes/historial) y su
enforcement en los modelos correspondientes. `deluxe` no tiene límites.
