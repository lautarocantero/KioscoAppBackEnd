/══════════════════════════════════════════════════════════════════════╗ 
║ 🏗️ Architecture.md                                                  ║ ╚══════════════════════════════════════════════════════════════════════╝/

📜 PropósitoEste backend está diseñado para ser modular, expresivo y escalable.La documentación integrada explica cada componente, su propósito y cómo se conectan,sirviendo como mapa maestro para el equipo y como guía de onboarding para nuevos devs.

🌀 Flujo estándar de una petición

[Request] → [Router] → [Controller] → [Model] → [Schema] → [DB Local/SQL] → [Response]

| Componente  | Propósito                                      |
|-------------|------------------------------------------------|
| **Router**  | Define endpoints por recurso                   |
| **Controller** | Contiene la lógica de negocio               |
| **Model**   | Abstrae el acceso a la base de datos           |
| **Schema**  | Define estructuras locales como fallback offline |
| **DB**      | Puede ser `db-local` o SQL según disponibilidad |
| **Response**| Devuelve datos seguros y validados             |

📁 Organización de carpetas

- **controllers/** → Lógica de negocio por recurso  
- **routes/** → Endpoints disponibles por recurso  
- **models/** → Abstracción de acceso a la base de datos  
- **schemas/** → Estructuras locales (fallback offline)  
- **typings/** → Tipados: entidades, payloads, requests, públicos  
- **utils/** → Funciones auxiliares reutilizables (ej. manejo de errores)  
- **documentation/** → Archivos `.md` que explican cada componente del sistema  

🧩 Tipado modular

Cada recurso (`Auth`, `Product`, `Seller`, etc.) tiene su propio archivo en `typings/` con:

- **Entity** → definición base  
- **Repository** → funciones de acceso (`find`, `save`, `remove`)  
- **PayloadUnknown** → datos sin validar  
- **Payloads** → operaciones específicas (Get, Create, Edit, Delete)  
- **Requests** → tipado de Express para endpoints  
- **Public** → versiones seguras que ocultan campos sensibles  
Tabla alternativa:

🔄 Dualidad de persistencia

- **SQL** → Fuente principal de verdad.  
- **db-local** → Fallback temporal en caso de falta de conexión.  
- Los modelos abstraen esta dualidad y sincronizan datos cuando hay conexión.  

🛡️ Seguridad y validación

- Los **Payloads** se validan antes de persistir.  
- Las respuestas usan tipos **Public** para ocultar campos sensibles.  
- Los errores se manejan con **handleControllerError** desde `utils/`.  

📚 Documentación integrada

La carpeta `documentation/` contiene guías:

- **Routes.md** → Mapa de endpoints  
- **Schemas.md** → Filosofía local vs SQL  
- **Controllers.md** → Flujo y propósito  
- **Models.md** → Acceso a datos  
- **Typings.md** → Derivaciones y contratos  
- **Utils.md** → Helpers y manejo de errores  
- **Architecture.md** → Este mapa general  

Conclusión
Este proyecto trasciende el simple desarrollo de código: constituye una arquitectura técnica sólida y bien estructurada. Cada componente cumple un propósito definido, respaldado por una documentación integrada que facilita tanto el proceso de incorporación de nuevos desarrolladores como la evolución continua del sistema.

La combinación de una arquitectura clara y una documentación consistente garantiza un onboarding eficiente y una base confiable para el crecimiento del proyecto.

