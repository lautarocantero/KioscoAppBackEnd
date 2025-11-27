
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
    create(data: T): T<T>;
    find(query: Partial<T> | ((item: T) => boolean)): T[];
    findOne(query: Partial<T> | ((item: T) => boolean)): T<T> | undefined;
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

