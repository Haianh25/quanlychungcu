const billService = require('../utils/billService');
const db = require('../db');
const mailer = require('../utils/mailer');

// --- MOCKING DEPENDENCIES ---
jest.mock('../db');
jest.mock('../utils/mailer');

describe('Bill Service Unit Tests', () => {
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();

        mockClient = {
            query: jest.fn(),
            release: jest.fn(),
        };

        if (db.getPool) {
            db.getPool.mockReturnValue({
                connect: jest.fn().mockResolvedValue(mockClient),
            });
        } else {
            db.connect = jest.fn().mockResolvedValue(mockClient);
        }
    });

    /**
     * BILL_13: isOverdue logic unit test
     */
    describe('isOverdue', () => {
        test('Should return true if due date is in the past', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            expect(billService.isOverdue(pastDate)).toBe(true);
        });

        // BILL_13
        test('Should return false if due date is in the future (BILL_13)', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            expect(billService.isOverdue(futureDate)).toBe(false);
        });
    });
});