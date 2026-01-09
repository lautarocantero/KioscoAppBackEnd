/*──────────────────────────────
📘 Guía para agregar un nuevo Modelo
──────────────────────────────
📜 Propósito:
Definir y documentar un nuevo modelo (ej: OrderModel, CustomerModel) siguiendo
los estándares de estilo y seguridad del proyecto.

🧩 Pasos:
1. Crear el Schema correspondiente en /schemas (ej: OrderSchema).
2. Definir los tipos en /typings (payloads, entidad principal, ModelType).
3. Importar Schema, Validation y tipos en el nuevo archivo de modelo.
4. Implementar métodos CRUD:
   - GET: obtener registros (limitados a 100).
   - POST: crear registro validando campos y controlando duplicados.
   - DELETE: eliminar registro por _id.
   - PUT: editar registro validando campos.
5. Documentar cada función con bloques teatrales:
   - Entrada (payload esperado).
   - Proceso (validaciones, lógica).
   - Salida (tipo devuelto).
   - Errores (casos de fallo).
6. Agregar bloque inicial con:
   - Propósito del modelo.
   - Dependencias.
   - Tipos usados.
   - Seguridad.
   - Flujo de operaciones.

🛡️ Seguridad:
- Validar todos los campos con Validation.
- Evitar duplicados en campos clave (ej: name, email).
- Nunca exponer datos sensibles en respuestas.
- Manejar errores con mensajes claros.

🌀 Flujo estándar:
[GetAll] → devuelve hasta 100 registros
[GetByField] → busca registros por campo validado
[Create] → valida campos, controla duplicados, guarda registro
[Delete] → elimina registro por _id
[Edit] → actualiza datos validados
──────────────────────────────*/
