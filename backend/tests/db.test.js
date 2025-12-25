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
});