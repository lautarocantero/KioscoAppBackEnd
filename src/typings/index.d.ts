declare module 'db-local' {
  interface FieldDefinition {
    type: any;
    required?: boolean;
    default?: any;
  }

  interface SchemaDefinition {
    [key: string]: FieldDefinition;
  }

  interface Document<T> {
    save(): T;
  }

  interface Schema<T> {
    create(data: T): Document<T>;
    find(query: Partial<T> | ((item: T) => boolean)): T[];
    findOne(query: Partial<T> | ((item: T) => boolean)): T | undefined;
    update(query: Partial<T>, update: Partial<T>): void;
    delete(query: Partial<T>): void;
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

