/*──────────────────────────────
📘 db-local.d.ts
──────────────────────────────
📜 Propósito:
Definir tipados para el módulo `db-local`.  
Permite crear esquemas locales que actúan como **fallback offline** cuando no hay conexión a SQL.

🧩 Interfaces:
- FieldDefinition → Define tipo, obligatoriedad y valor por defecto de un campo.
- SchemaDefinition → Mapa de campos que conforman un esquema.
- Schema<T> → API para interactuar con datos locales:
  • create(data: T) → Crear registro
  • find(query) → Buscar múltiples registros
  • findOne(query) → Buscar un único registro
  • save(query, update) → Actualizar registros
  • remove(query) → Eliminar registros
- DBLocalOptions → Configuración inicial (path de almacenamiento local).

🏗️ Clase principal:
- DBLocal → Constructor recibe opciones.
- Schema<T>(name, definition) → Crea un esquema tipado para operar en DB local.

🛡️ Notas:
- Este módulo NO reemplaza la base SQL, solo actúa como respaldo local.
- Los datos aquí son temporales y se sincronizan con SQL cuando hay conexión.
──────────────────────────────*/

declare module 'db-local' {
  interface FieldDefinition {
    type: unknown;
    required?: boolean;
    default?: unknown;
  }

  interface SchemaDefinition {
    [key: string]: FieldDefinition;
  }

  interface Schema<T> {
    create(data: T): T;
    find(query: Partial<T> | ((item: T) => boolean)): T[];
    findOne(query: Partial<T> | ((item: T) => boolean)): T | undefined;
    save(query: Partial<T>, update: Partial<T>): void;
    remove(query: Partial<T> | ((item: T) => boolean)): void;
  }

  interface DBLocalOptions {
    path: string;
  }

  class DBLocal {
    constructor(options: DBLocalOptions);
    Schema<T>(name: string, definition: SchemaDefinition): Schema<T>;
  }

  export default DBLocal;
}
