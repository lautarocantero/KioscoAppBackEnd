/*──────────────────────────────
📘 Utils Folder
──────────────────────────────
📜 Propósito:
La carpeta `utils/` centraliza funciones auxiliares y herramientas reutilizables.  
Su objetivo es **evitar duplicación de lógica** y proveer utilitarios comunes para controladores, servicios y middlewares.

🧩 Organización:
- Cada archivo dentro de `utils/` define una función o conjunto de funciones pequeñas y específicas.
- Ejemplo actual: `handleControllerError.ts` → Manejo centralizado de errores en controladores.
- Futuro: validadores, formateadores, helpers de fechas, generadores de IDs, etc.

🛡️ Filosofía:
- Mantener funciones **puras y reutilizables**.
- No depender de estados globales ni lógica de negocio.
- Ser simples, expresivas y fáciles de testear.

🌀 Flujo estándar:
[Controller/Service] → [Util] → [Respuesta/Acción]

──────────────────────────────
🔑 Beneficios
──────────────────────────────
- Claridad: todas las funciones auxiliares están en un solo lugar.
- Escalabilidad: facilita agregar nuevos helpers sin ensuciar controladores.
- Consistencia: asegura que todos los módulos usen la misma lógica auxiliar.
──────────────────────────────*/
