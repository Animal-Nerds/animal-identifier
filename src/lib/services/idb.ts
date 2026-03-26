export interface IDBTableSchema {
    tableName: string;
    keyPath: string;
}
export interface IDBOutput {
    records: object[];
    error: Error | null;
}


export class IDB {
    private indexedDB: IDBFactory;
    private dbName: string;
    private db: IDBDatabase | null;
    private schema: IDBTableSchema[];
    private version: number;

    constructor(indexedDB: IDBFactory, dbName: string, version: number, schema: IDBTableSchema[]) {
        this.indexedDB = indexedDB;
        this.dbName = dbName;
        this.schema = schema;
        this.version = version;
        this.db = null;
    }
    async open() {
        return new Promise<void>((resolve, reject) => {
            const request = this.indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                this.ensureSchema(this.db);
            }
            request.onerror = (event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };
            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                this.db.onerror = (event) => {
                    reject((event.target as IDBRequest).error);
                };
                resolve();
            };
        });
    }
    private ensureSchema(db: IDBDatabase) {
        for (const tableSchema of this.schema) {
            db.createObjectStore(tableSchema.tableName, {
                keyPath: tableSchema.keyPath
            });
        }
    }
    async getAll(tableName: string) {
        if (this.schema.some(s => s.tableName === tableName) === undefined) {
            throw new Error(`Table '${tableName}' is not defined in the schema`);
        }
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<IDBOutput>(resolve => {
            try {
                const request = this.db!.transaction(tableName, 'readonly')
                    .objectStore(tableName)
                    .getAll();
                request.onsuccess = (event) => {
                    resolve({ records: (event.target as IDBRequest).result, error: null });
                };
                request.onerror = (event) => {
                    resolve({ records: [], error: (event.target as IDBRequest).error });
                };
            } catch (error) {
                if (error instanceof Error) {
                    resolve({ records: [], error });
                } else {
                    resolve({ records: [], error: new Error('Unknown error') });
                }
            }
        });
    }
    async getByKey(tableName: string, id: string) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<IDBOutput>(resolve => {
            try {
                const request = this.db!.transaction(tableName, 'readonly')
                    .objectStore(tableName)
                    .get(id);
                request.onsuccess = (event) => {
                    resolve({ records: [(event.target as IDBRequest).result], error: null });
                };
                request.onerror = (event) => {
                    resolve({ records: [], error: (event.target as IDBRequest).error });
                };
            } catch (error) {
                if (error instanceof Error) {
                    resolve({ records: [], error });
                } else {
                    resolve({ records: [], error: new Error('Unknown error') });
                }
            }
        });
    }
    async add(tableName: string, data: object) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<IDBOutput>(resolve => {
            try {
                const request = this.db!.transaction(tableName, 'readwrite')
                    .objectStore(tableName)
                    .add(data);
                request.onsuccess = () => {
                    resolve({ records: [data], error: null });
                };
                request.onerror = (event) => {
                    resolve({ records: [], error: (event.target as IDBRequest).error });
                };
            } catch (error) {
                if (error instanceof Error) {
                    resolve({ records: [], error });
                } else {
                    resolve({ records: [], error: new Error('Unknown error') });
                }
            }
        });
    }
    async update(tableName: string, id: string, data: object) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise<IDBOutput>(resolve => {
            try {
                const request = this.db!.transaction(tableName, 'readwrite');
                const store = request.objectStore(tableName);
                const getRequest = store.get(id);

                getRequest.onsuccess = (event) => {
                    const record = (event.target as IDBRequest).result;
                    if (!record) {
                        resolve({ records: [], error: new Error(`Record with id '${id}' not found in table '${tableName}'`) });
                        return;
                    }
                    const updatedRecord = { ...record, ...data };
                    const updateRequest = store.put(updatedRecord);
                    updateRequest.onsuccess = () => {
                        resolve({ records: [updatedRecord], error: null });
                    };
                    updateRequest.onerror = (event) => {
                        resolve({ records: [], error: (event.target as IDBRequest).error });
                    };
                };
                getRequest.onerror = (event) => {
                    resolve({ records: [], error: (event.target as IDBRequest).error });
                };

            } catch (error) {
                if (error instanceof Error) {
                    resolve({ records: [], error });
                } else {
                    resolve({ records: [], error: new Error('Unknown error') });
                }
            }
        });
    }
    async delete(tableName: string, id: string) {
        if (!this.db) throw new Error('Database not initialized');
        
        return new Promise<IDBOutput>(resolve => {
            try {
                const request = this.db!.transaction(tableName, 'readwrite')
                    .objectStore(tableName)
                    .delete(id);
                request.onsuccess = () => {
                    resolve({ records: [], error: null });
                };
                request.onerror = (event) => {
                    resolve({ records: [], error: (event.target as IDBRequest).error });
                };
            } catch (error) {
                if (error instanceof Error) {
                    resolve({ records: [], error });
                } else {
                    resolve({ records: [], error: new Error('Unknown error') });
                }
            }
        });
    }
}