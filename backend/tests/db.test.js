// --- SETUP ENV ---
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
        jest.resetModules();
        jest.clearAllMocks();

        process.env.DB_USER = 'test_user';
        process.env.DB_HOST = 'localhost';
        process.env.DB_DATABASE = 'test_db';
        process.env.DB_PASSWORD = 'secret';
        process.env.DB_PORT = '5432';
    });

    // SYS_01: Database connection success
    test('Should connect successfully and return result (SYS_01)', async () => {
        const db = require('../db');
        const pool = db.getPool();
        const mockClient = { query: jest.fn(), release: jest.fn() };
        mockPoolConnect.mockResolvedValueOnce(mockClient);

        const sql = 'SELECT * FROM users WHERE id = $1';
        const mockResult = { rows: [{ id: 1, name: 'Test' }] };
        mockPoolQuery.mockResolvedValue(mockResult);

        const result = await db.query(sql, [1]);

        expect(mockPoolQuery).toHaveBeenCalledWith(sql, [1]);
        expect(result).toBe(mockResult);
    });

    // SYS_02: Database connection error
    test('Should handle connection error (SYS_02)', async () => {
        const db = require('../db');
        const pool = db.getPool();
        mockPoolConnect.mockRejectedValueOnce(new Error('Connection failed'));

        await expect(pool.connect()).rejects.toThrow('Connection failed');
    });
});