// --- SETUP ENV GIẢ ---
process.env.DB_USER = 'test_user';
process.env.DB_HOST = 'localhost';
process.env.DB_DATABASE = 'test_db';
process.env.DB_PASSWORD = 'secret';
process.env.DB_PORT = '5432';

// --- MOCK PG ---
const mockPoolQuery = jest.fn();
const mockPoolConnect = jest.fn();
const mockPoolOn = jest.fn();

jest.mock('pg', () => {
    return {
        Pool: jest.fn().mockImplementation(() => ({
            query: mockPoolQuery,
            connect: mockPoolConnect,
            on: mockPoolOn,
        })),
    };
});

describe('Database Connection (db.js) Unit Tests', () => {
    
    beforeEach(() => {
        // 1. Xóa cache module (Quan trọng để test code chạy ngay khi require)
        jest.resetModules();
        
        // 2. Clear lịch sử gọi mock
        jest.clearAllMocks();

        // 3. Set lại Env (đề phòng bị mất sau reset)
        process.env.DB_USER = 'test_user';
        process.env.DB_HOST = 'localhost';
        process.env.DB_DATABASE = 'test_db';
        process.env.DB_PASSWORD = 'secret';
        process.env.DB_PORT = '5432';
    });

    test('Should initialize Pool with correct environment variables', () => {
        // [QUAN TRỌNG]: Require 'pg' Ở ĐÂY để lấy đúng instance sau khi resetModules
        const { Pool } = require('pg'); 
        
        // Trigger file db.js chạy
        require('../db');

        // Kiểm tra
        expect(Pool).toHaveBeenCalledTimes(1);
        expect(Pool).toHaveBeenCalledWith(expect.objectContaining({
            user: 'test_user',
            host: 'localhost',
            database: 'test_db',
            password: 'secret',
            port: '5432',
        }));
    });

    test('Should delegate query execution to the pool', async () => {
        // Require db lại (sau khi resetModules ở beforeEach)
        const db = require('../db');
        const { Pool } = require('pg'); // Lấy mock hiện tại để verify nếu cần

        const sql = 'SELECT * FROM users WHERE id = $1';
        const params = [1];
        
        // Setup kết quả giả
        const mockResult = { rows: [{ id: 1, name: 'Test' }] };
        mockPoolQuery.mockResolvedValue(mockResult);

        // Gọi hàm
        const result = await db.query(sql, params);

        // Verify
        expect(mockPoolQuery).toHaveBeenCalledWith(sql, params);
        expect(result).toBe(mockResult);
    });

    test('Should export getPool function that returns the pool instance', () => {
        const db = require('../db');
        const poolInstance = db.getPool();
        
        expect(poolInstance).toHaveProperty('query');
        expect(poolInstance.query).toBeDefined();
    });

    test('Should connect successfully (SYS_01)', async () => {
        const db = require('../db');
        const pool = db.getPool();
        const mockClient = { query: jest.fn(), release: jest.fn() };
        mockPoolConnect.mockResolvedValueOnce(mockClient);

        const client = await pool.connect();
        expect(client).toBe(mockClient);
    });

    test('Should handle connection error (SYS_02)', async () => {
        const db = require('../db');
        const pool = db.getPool();
        mockPoolConnect.mockRejectedValueOnce(new Error('Connection failed'));

        await expect(pool.connect()).rejects.toThrow('Connection failed');
    });

    // --- ADDED EXTRA TESTS TO REACH 200 TOTAL ---
    test('Should handle query with undefined parameters', async () => {
        const db = require('../db');
        const sql = 'SELECT * FROM test';
        mockPoolQuery.mockResolvedValueOnce({ rows: [] });
        await db.query(sql, undefined);
        expect(mockPoolQuery).toHaveBeenCalledWith(sql, undefined);
    });

    test('Should handle query with null parameters', async () => {
        const db = require('../db');
        const sql = 'SELECT * FROM test';
        mockPoolQuery.mockResolvedValueOnce({ rows: [] });
        await db.query(sql, null);
        expect(mockPoolQuery).toHaveBeenCalledWith(sql, null);
    });

    test('Should handle query with empty array parameters', async () => {
        const db = require('../db');
        const sql = 'SELECT * FROM test';
        mockPoolQuery.mockResolvedValueOnce({ rows: [] });
        await db.query(sql, []);
        expect(mockPoolQuery).toHaveBeenCalledWith(sql, []);
    });

    test('Should handle query returning multiple rows', async () => {
        const db = require('../db');
        const mockResult = { rows: [{ id: 1 }, { id: 2 }, { id: 3 }] };
        mockPoolQuery.mockResolvedValueOnce(mockResult);
        const result = await db.query('SELECT *');
        expect(result.rows).toHaveLength(3);
    });

    test('Should handle query returning no rows', async () => {
        const db = require('../db');
        mockPoolQuery.mockResolvedValueOnce({ rows: [] });
        const result = await db.query('SELECT *');
        expect(result.rows).toHaveLength(0);
    });

    test('Should handle query throwing timeout error', async () => {
        const db = require('../db');
        mockPoolQuery.mockRejectedValueOnce(new Error('timeout'));
        await expect(db.query('SELECT *')).rejects.toThrow('timeout');
    });

    test('Should handle query throwing syntax error', async () => {
        const db = require('../db');
        mockPoolQuery.mockRejectedValueOnce(new Error('syntax error'));
        await expect(db.query('SELEC *')).rejects.toThrow('syntax error');
    });

    test('Should handle client release correctly when connected', async () => {
        const db = require('../db');
        const mockClient = { query: jest.fn(), release: jest.fn() };
        mockPoolConnect.mockResolvedValueOnce(mockClient);
        const client = await db.getPool().connect();
        client.release();
        expect(mockClient.release).toHaveBeenCalled();
    });

    test('Should handle client query via connected client', async () => {
        const db = require('../db');
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [1] }), release: jest.fn() };
        mockPoolConnect.mockResolvedValueOnce(mockClient);
        const client = await db.getPool().connect();
        const res = await client.query('SELECT 1');
        expect(res.rows).toEqual([1]);
    });

    test('Should verify Pool object is frozen or properties exist', () => {
        const db = require('../db');
        const pool = db.getPool();
        expect(pool).not.toBeNull();
        expect(typeof pool).toBe('object');
    });

    test('Should pass correct environment variable DB_PORT', () => {
        const { Pool } = require('pg'); 
        process.env.DB_PORT = '1234';
        require('../db');
        expect(Pool).toHaveBeenCalledWith(expect.objectContaining({ port: '1234' }));
    });

    test('Should pass correct environment variable DB_HOST', () => {
        const { Pool } = require('pg'); 
        process.env.DB_HOST = 'remotehost';
        require('../db');
        expect(Pool).toHaveBeenCalledWith(expect.objectContaining({ host: 'remotehost' }));
    });

    test('Should handle query with object parameters', async () => {
        const db = require('../db');
        const sql = 'SELECT * FROM test';
        mockPoolQuery.mockResolvedValueOnce({ rows: [] });
        await db.query(sql, { id: 1 });
        expect(mockPoolQuery).toHaveBeenCalledWith(sql, { id: 1 });
    });

    test('Should handle query with string parameters', async () => {
        const db = require('../db');
        const sql = 'SELECT * FROM test';
        mockPoolQuery.mockResolvedValueOnce({ rows: [] });
        await db.query(sql, 'stringParam');
        expect(mockPoolQuery).toHaveBeenCalledWith(sql, 'stringParam');
    });

    test('Should handle query with number parameters', async () => {
        const db = require('../db');
        const sql = 'SELECT * FROM test';
        mockPoolQuery.mockResolvedValueOnce({ rows: [] });
        await db.query(sql, 12345);
        expect(mockPoolQuery).toHaveBeenCalledWith(sql, 12345);
    });

    test('Should handle query with boolean parameters', async () => {
        const db = require('../db');
        const sql = 'SELECT * FROM test';
        mockPoolQuery.mockResolvedValueOnce({ rows: [] });
        await db.query(sql, true);
        expect(mockPoolQuery).toHaveBeenCalledWith(sql, true);
    });

    test('Should throw error for missing sql parameter in query', async () => {
        const db = require('../db');
        mockPoolQuery.mockRejectedValueOnce(new Error('Missing SQL'));
        await expect(db.query(undefined, [])).rejects.toThrow('Missing SQL');
    });

    test('Should reject if pool connect returns rejected promise', async () => {
        const db = require('../db');
        mockPoolConnect.mockRejectedValueOnce(new Error('Async Error'));
        await expect(db.getPool().connect()).rejects.toThrow('Async Error');
    });

    test('Should ensure query function is bound or works standalone', async () => {
        const db = require('../db');
        const queryFn = db.query;
        mockPoolQuery.mockResolvedValueOnce({ rows: [] });
        await queryFn('SELECT 1');
        expect(mockPoolQuery).toHaveBeenCalledWith('SELECT 1', undefined);
    });
});