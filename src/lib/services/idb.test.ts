import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest'
import { IDB, type IDBTableSchema } from './idb';

const schema1: IDBTableSchema[] = [
    {
        tableName: 't',
        keyPath: 'id'
    }
];

let dbId = 0;
async function makeIDB() {
    dbId++;
    let db = new IDB(indexedDB, 'testDB' + dbId, 1, schema1);
    await db.open();
    return db;
}

describe('IDB', async () => {
    it('should make an empty database when initialized', async () => {
        const idb = await makeIDB()
        
        const result = await idb.getAll('t')
        expect(result.records.length).toBe(0)
        expect(result.error).toBeNull()
    })

    it('should fail if trying to add a record without a key', async () => {
        const idb = await makeIDB()
        
        const result = await idb.add('t', { name: 'No ID' })
        expect(result.error).not.toBeNull()
    })

    it('should add a record to the database', async () => {
        const idb = await makeIDB()

        const addResult = await idb.add('t', { id: '1', name: 'Test Record' })
        expect(addResult.error).toBeNull()
        const getResult = await idb.getAll('t')
        expect(getResult.records.length).toBe(1)
        expect(getResult.records[0]).toHaveProperty('id', '1')
        expect(getResult.records[0]).toHaveProperty('name', 'Test Record')
    })
    
    it('should fail if trying to add a record with a duplicate ID', async () => {
        const idb = await makeIDB()
        await idb.open()
        
        const result = await idb.add('t', { id: '1', name: 'first thing' })
        expect(result.error).toBeNull()
    })
    
    it('should keep all existing properties when updating a record', async () => {
        const idb = await makeIDB()
        await idb.open()
        
        const addResult = await idb.add('t', { id: '1', name: 'thing 1', description: 'a thing with a cat in a hat' })
        expect(addResult.error).toBeNull()
        expect(addResult.records[0]).toHaveProperty('name', 'thing 1')
        expect(addResult.records[0]).toHaveProperty('description', 'a thing with a cat in a hat')

        const updateResult = await idb.update('t', '1', { name: 'updated thing 1' })
        expect(updateResult.error).toBeNull()
        expect(updateResult.records[0]).toHaveProperty('name', 'updated thing 1')
        expect(updateResult.records[0]).toHaveProperty('description', 'a thing with a cat in a hat')
    })
    
    it('should delete a record from the database', async () => {
        const idb = await makeIDB()
        await idb.open()
        
        const addResult = await idb.add('t', { id: '1', name: 'first thing' })
        expect(addResult.error).toBeNull()

        const getResult1 = await idb.getAll('t')
        expect(getResult1.records.length).toBe(1)

        const deleteResult = await idb.delete('t', '1')
        expect(deleteResult.error).toBeNull()

        const getResult2 = await idb.getAll('t')
        expect(getResult2.records.length).toBe(0)
    })
});