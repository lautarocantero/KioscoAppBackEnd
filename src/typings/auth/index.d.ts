declare module 'db-local' {
  interface FieldDefinition {
    type: unknown;
    required?: boolean;
    default?: unknown;
  }

  interface SchemaDefinition {
    [key: string]: FieldDefinition;
  }

  export interface DocumentAuth {
    _id: string;
    email: string;
    username: string;
    password: string;
    authToken: string;
    refreshToken: string;
  }

  interface Schema<T> {
    create(data: T): DocumentAuth<T>;
    find(query: Partial<T> | ((item: T) => boolean)): T[];
    findOne(query: Partial<T> | ((item: T) => boolean)): DocumentAuth<T> | undefined;
    update(query: Partial<T>, update: Partial<T>): void;
    // remove(query: Partial<T> | ((item: T) => boolean)): void;
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

