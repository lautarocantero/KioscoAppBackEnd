/*──────────────────────────────
📘 Guía para agregar un nuevo Controlador
──────────────────────────────
📜 Propósito:
Definir y documentar un nuevo controlador (ej: ProductController, OrderController) siguiendo
los estándares de estilo y seguridad del proyecto.

🧩 Pasos:
1. Crear el archivo del controlador en /controllers (ej: orderController.ts).
2. Importar `Request`, `Response` de express, el modelo correspondiente y los tipos de payload.
3. Implementar funciones para cada endpoint:
   - GET: obtener registros o buscar por campo.
   - POST: crear registro validando campos.
   - DELETE: eliminar registro por _id.
   - PUT: editar registro validando campos.
4. Usar `handleControllerError` para manejar errores de forma uniforme.
5. Documentar cada función con bloques teatrales:
   - Entrada (payload esperado).
   - Proceso (validaciones, llamada al modelo).
   - Salida (tipo devuelto).
   - Errores (casos de fallo).
6. Agregar bloque inicial con:
   - Propósito del controlador.
   - Dependencias.
   - Endpoints soportados (tabla).
   - Seguridad.
   - Flujo de endpoints.

🛡️ Seguridad:
- Validar siempre los datos antes de invocar el modelo.
- Manejar errores con `handleControllerError`.
- Definir qué endpoints requieren autenticación.
- Nunca exponer datos sensibles en las respuestas.

🌀 Flujo estándar:
[Route] → [Controller] → [Model] → [DB] → [Controller] → [Response]

📂 Organización:
- /controllers → aquí viven los controladores.
- Cada archivo debe manejar un recurso (Product, Seller, Order, etc.).
- Documentar al inicio del archivo los endpoints soportados en tabla.
──────────────────────────────*/
