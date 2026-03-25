export interface IDBTableSchema {
    tableName: string;
    keyPath: string;
    autoIncrement?: boolean;
}
export interface IDBOutput {
    records: object[];
    error: Error | null;
}


export class IDB {
    private dbName: string;
    private db: IDBDatabase | null;
    private schema: IDBTableSchema[];

    constructor(dbName: string, schema: IDBTableSchema[]) {
        this.dbName = dbName;
        this.schema = schema;
        this.db = null;
    }
    async open() {
        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(this.dbName);
            request.onerror = (event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };
            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                this.db.onerror = (event) => {
                    reject((event.target as IDBRequest).error);
                };
                this.ensureSchema();
                resolve();
            };
        });
    }
    private ensureSchema() {
        if (!this.db) throw new Error('Database not initialized');

        for (const tableSchema of this.schema) {
            if (!this.db.objectStoreNames.contains(tableSchema.tableName)) {
                this.db.createObjectStore(tableSchema.tableName, {
                    keyPath: tableSchema.keyPath,
                    autoIncrement: tableSchema.autoIncrement
                });
            }
        }
    }
    async getAll(tableName: string) {
        if (this.schema.some(s => s.tableName === tableName) === undefined) {
            throw new Error(`Table '${tableName}' is not defined in the schema`);
        }
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<IDBOutput>((resolve, reject) => {
            const request = this.db!.transaction(tableName, 'readonly')
                .objectStore(tableName)
                .getAll();
            request.onsuccess = (event) => {
                resolve({ records: (event.target as IDBRequest).result, error: null });
            };
            request.onerror = (event) => {
                resolve({ records: [], error: (event.target as IDBRequest).error });
            };
        });
    }
    async getByKey(tableName: string, id: string) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<IDBOutput>((resolve, reject) => {
            const request = this.db!.transaction(tableName, 'readonly')
                .objectStore(tableName)
                .get(id);
            request.onsuccess = (event) => {
                resolve({ records: [(event.target as IDBRequest).result], error: null });
            };
            request.onerror = (event) => {
                resolve({ records: [], error: (event.target as IDBRequest).error });
            };
        });
    }
    async add(tableName: string, data: object) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<IDBOutput>((resolve, reject) => {
            const request = this.db!.transaction(tableName, 'readwrite')
                .objectStore(tableName)
                .add(data);
            request.onsuccess = () => {
                resolve({ records: [data], error: null });
            };
            request.onerror = (event) => {
                resolve({ records: [], error: (event.target as IDBRequest).error });
            };
        });
    }
    async update(tableName: string, id: string, data: object) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<IDBOutput>((resolve, reject) => {
            const request = this.db!.transaction(tableName, 'readwrite')
                .objectStore(tableName)
                .put(data, id);
            request.onsuccess = () => {
                resolve({ records: [data], error: null });
            };
            request.onerror = (event) => {
                resolve({ records: [], error: (event.target as IDBRequest).error });
            };
        });
    }
    async delete(tableName: string, id: string) {
        if (!this.db) throw new Error('Database not initialized');
        
        return new Promise<IDBOutput>((resolve, reject) => {
            const request = this.db!.transaction(tableName, 'readwrite')
                .objectStore(tableName)
                .delete(id);
            request.onsuccess = () => {
                resolve({ records: [], error: null });
            };
            request.onerror = (event) => {
                resolve({ records: [], error: (event.target as IDBRequest).error });
            };
        });
    }
}