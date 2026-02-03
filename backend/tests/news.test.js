const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// --- MOCK DB ---
jest.mock('../db', () => ({
    query: jest.fn()
}));

// --- MOCK UPLOAD MIDDLEWARE (Multer) ---
jest.mock('../utils/upload', () => ({
    single: (fieldName) => (req, res, next) => {
        // Mock success if a 'file' header is simulated, otherwise pass null
        if (req.headers['x-mock-file'] === 'true') {
            req.file = { filename: 'mock-image.jpg' };
        }
        next();
    }
}));

// --- MOCK AUTH MIDDLEWARE ---
jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => next(),
    isAdmin: (req, res, next) => next()
}));

const db = require('../db');
const newsRoutes = require('../routes/news');

describe('News Routes Unit Tests', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(bodyParser.json());
        app.use('/api/news', newsRoutes);
    });

    /**
     * TEST: GET ALL NEWS
     */
    describe('GET /api/news', () => {
        test('Should return list of active news', async () => {
            const mockNews = [
                { id: 1, title: 'Announcement 1', status: 'active' },
                { id: 2, title: 'Announcement 2', status: 'active' }
            ];
            db.query.mockResolvedValueOnce({ rows: mockNews });

            const res = await request(app).get('/api/news');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].title).toBe('Announcement 1');
        });

        test('Should handle server error', async () => {
            db.query.mockRejectedValueOnce(new Error('DB Error'));
            const res = await request(app).get('/api/news');
            expect(res.statusCode).toBe(500);
        });
    });

    /**
     * TEST: GET SINGLE NEWS
     */
    describe('GET /api/news/:id', () => {
        test('Should return news details if found', async () => {
            const mockItem = { id: 1, title: 'Detail News', status: 'active' };
            db.query.mockResolvedValueOnce({ rows: [mockItem] });

            const res = await request(app).get('/api/news/1');

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe('Detail News');
        });

        test('Should return 404 if not found', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app).get('/api/news/999');

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('News not found.');
        });
    });

    /**
     * TEST: UPLOAD IMAGE
     */
    describe('POST /api/news/upload-image', () => {
        test('Should upload image successfully (Mocked)', async () => {
            const res = await request(app)
                .post('/api/news/upload-image')
                .set('x-mock-file', 'true'); // Trigger custom mock multer

            expect(res.statusCode).toBe(200);
            expect(res.body.imageUrl).toContain('/uploads/proofs/mock-image.jpg');
        });

        test('Should return 400 if no file uploaded', async () => {
            const res = await request(app)
                .post('/api/news/upload-image'); // No header -> no file

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('No file uploaded');
        });
    });
});
