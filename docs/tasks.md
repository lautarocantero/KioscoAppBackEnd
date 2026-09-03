## 🗂️ To-Do / Roadmap

---
general: 

---
membresías:
- [ xxx ] Configurar credenciales reales de Mercado Pago: MP_ACCESS_TOKEN y
          MP_WEBHOOK_SECRET en el backend, VITE_MP_PUBLIC_KEY en el frontend
          (KioscoApp). Sin esto ningún checkout de membresía cobra de verdad
          (ni el flujo redirect ni el de tarjeta con Card Payment Brick) —
          POST /membership/checkout devuelve 400 y el pago con tarjeta muestra
          "no disponible". Ver docs/Membership.md.
---
ventas:
- [ xxx ] Envolver createSell en transacción Mongo (session): actualmente la venta se crea
          ANTES de descontar stock de presentaciones. Si decreaseStock falla (stock insuficiente,
          carrera entre vendedores), la venta queda guardada igual y el stock no se descuenta →
          inconsistencia entre "sells" y "presentations". Ideal: validar/reservar stock antes de
          crear la venta, o mongoose.startSession() + transaction con rollback de ambas operaciones.
---
