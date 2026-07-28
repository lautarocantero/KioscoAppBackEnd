## 🗂️ To-Do / Roadmap

---
general: 

---
ventas:
- [ xxx ] Envolver createSell en transacción Mongo (session): actualmente la venta se crea
          ANTES de descontar stock de presentaciones. Si decreaseStock falla (stock insuficiente,
          carrera entre vendedores), la venta queda guardada igual y el stock no se descuenta →
          inconsistencia entre "sells" y "presentations". Ideal: validar/reservar stock antes de
          crear la venta, o mongoose.startSession() + transaction con rollback de ambas operaciones.
---
