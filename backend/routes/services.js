const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware'); 
const upload = require('../utils/upload'); 
const fs = require('fs'); 
const path = require('path');

// GET /api/services/fees-table
router.get('/fees-table', async (req, res) => {
    try {
        const feeCodes = [
            'CAR_FEE', 'MOTORBIKE_FEE', 'BICYCLE_FEE',
            'CAR_CARD_FEE', 'MOTORBIKE_CARD_FEE', 'BICYCLE_CARD_FEE'
        ];
        const query = "SELECT fee_code, price FROM fees WHERE fee_code = ANY($1::text[])";
        const { rows } = await db.query(query, [feeCodes]);
        const prices = rows.reduce((acc, fee) => {
            acc[fee.fee_code] = fee.price;
            return acc;
        }, {});
        feeCodes.forEach(code => {
            if (!prices[code]) {
                prices[code] = null; 
            }
        });
        res.json(prices);
    } catch (err) {
        console.error('Error fetching fees table:', err);
        res.status(500).json({ message: 'Server error fetching fees table' });
    }
});

// GET /api/services/my-policy
router.get('/my-policy', protect, async (req, res) => {
    const residentId = req.user.user ? req.user.user.id : req.user.id;
    try {
        const userCheck = await db.query(
            `SELECT r.room_type 
             FROM users u 
             LEFT JOIN rooms r ON r.resident_id = u.id 
             WHERE u.id = $1`, 
            [residentId]
        );
        
        const roomType = userCheck.rows[0]?.room_type || 'A'; 

        const policyRes = await db.query(
            "SELECT max_cars, max_motorbikes, max_bicycles FROM room_type_policies WHERE type_code = $1", 
            [roomType]
        );
        
        let policy = { max_cars: 1, max_motorbikes: 2, max_bicycles: 2 }; 

        if (policyRes.rows.length > 0) {
            policy = policyRes.rows[0];
        }

        res.json({ roomType, ...policy });
    } catch (err) {
        console.error('Error fetching policy:', err);
        res.status(500).json({ message: 'Server error fetching policy.' });
    }
});

// GET /api/services/my-cards
router.get('/my-cards', protect, async (req, res) => {
    const residentId = req.user.user ? req.user.user.id : req.user.id;
    
    if (!residentId) {
        return res.status(401).json({ message: 'Cannot determine user ID.' });
    }
    
    try {
        const managedCardsRes = await db.query(
            `SELECT id, vehicle_type, license_plate, brand, color, status, issued_at
             FROM vehicle_cards 
             WHERE resident_id = $1 AND status IN ('active', 'inactive')`,
            [residentId]
        );
        const pendingRequestsRes = await db.query(
            `SELECT id AS request_id, vehicle_type, license_plate, brand, color, status, request_type, target_card_id
             FROM vehicle_card_requests 
             WHERE resident_id = $1 AND status = 'pending'`,
            [residentId]
        );
        const historyCardsRes = await db.query(
            `SELECT id, vehicle_type, license_plate, brand, color, status, issued_at
             FROM vehicle_cards
             WHERE resident_id = $1 AND status IN ('canceled', 'lost')
             ORDER BY issued_at DESC`,
            [residentId]
        );

        const managedCards = [...managedCardsRes.rows];
        const pendingRegistrations = [];
        const pendingCardIds = new Map(); 

        pendingRequestsRes.rows.forEach(req => {
            if (req.request_type === 'register') {
                pendingRegistrations.push({
                    id: `req-${req.request_id}`, 
                    real_request_id: req.request_id,
                    type: req.vehicle_type,
                    brand: req.brand,
                    license_plate: req.license_plate || 'N/A',
                    status: 'pending_register'
                });
            } else if (req.target_card_id) {
                pendingCardIds.set(req.target_card_id, `pending_${req.request_type}`);
            }
        });

        const finalManagedCards = managedCards.map(card => {
            if (pendingCardIds.has(card.id)) {
                return { ...card, status: pendingCardIds.get(card.id) }; 
            }
            return card;
        }).concat(pendingRegistrations);

        res.json({
            managedCards: finalManagedCards,
            historyCards: historyCardsRes.rows
        });
    } catch (err) {
        console.error('Error fetching user vehicle cards:', err);
        res.status(500).json({ message: 'Server error loading cards.' });
    }
});

// POST /api/services/register-card
router.post('/register-card', protect, upload.single('proofImage'), async (req, res) => {
    const residentId = req.user.user ? req.user.user.id : req.user.id;
    const residentFullName = req.user.user ? req.user.user.full_name : req.user.full_name;

    if (!residentId || !residentFullName) {
        return res.status(401).json({ message: 'Invalid token or missing user info.' });
    }

    const {
        vehicleType, fullName, dob, phone, relationship,
        licensePlate, brand, color
    } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Proof image is required.' });
    }
    const proofImageUrl = `/uploads/proofs/${req.file.filename}`;

    const pool = db.getPool ? db.getPool() : db;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check 1: User có phòng chưa
        const userCheck = await client.query(
            `SELECT u.apartment_number, r.room_type 
             FROM users u 
             LEFT JOIN rooms r ON r.resident_id = u.id 
             WHERE u.id = $1`, 
            [residentId]
        );
        
        const userInfo = userCheck.rows[0];
        if (!userInfo || !userInfo.apartment_number) {
            throw new Error('You have not been assigned an apartment yet. Please contact Admin.');
        }

        // Logic giới hạn xe
        const roomType = userInfo.room_type || 'A'; 
        const policyRes = await client.query(
            "SELECT max_cars, max_motorbikes, max_bicycles FROM room_type_policies WHERE type_code = $1", 
            [roomType]
        );
        
        let maxCars = 1, maxMotorbikes = 2, maxBicycles = 2;
        if (policyRes.rows.length > 0) {
            maxCars = policyRes.rows[0].max_cars;
            maxMotorbikes = policyRes.rows[0].max_motorbikes;
            maxBicycles = policyRes.rows[0].max_bicycles;
        }

        const activeCardRes = await client.query(
            'SELECT vehicle_type, COUNT(*) as count FROM vehicle_cards WHERE resident_id = $1 AND status IN ($2, $3) GROUP BY vehicle_type',
            [residentId, 'active', 'inactive']
        );
        const activeCounts = activeCardRes.rows.reduce((acc, row) => {
            acc[row.vehicle_type] = parseInt(row.count, 10);
            return acc;
        }, { car: 0, motorbike: 0, bicycle: 0 }); 
        
        const pendingReqRes = await client.query(
            'SELECT vehicle_type, COUNT(*) as count FROM vehicle_card_requests WHERE resident_id = $1 AND status = $2 AND request_type = $3 GROUP BY vehicle_type',
            [residentId, 'pending', 'register']
        );
        const pendingCounts = pendingReqRes.rows.reduce((acc, row) => {
            acc[row.vehicle_type] = parseInt(row.count, 10);
            return acc;
        }, { car: 0, motorbike: 0, bicycle: 0 }); 
        
        const totalCarCount = (activeCounts.car || 0) + (pendingCounts.car || 0);
        const totalMotorbikeCount = (activeCounts.motorbike || 0) + (pendingCounts.motorbike || 0);
        const totalBicycleCount = (activeCounts.bicycle || 0) + (pendingCounts.bicycle || 0);
        
        if (vehicleType === 'car' && totalCarCount >= maxCars) {
            throw new Error(`Limit reached for Room Type ${roomType}: Max ${maxCars} car(s) allowed.`);
        }
        if (vehicleType === 'motorbike' && totalMotorbikeCount >= maxMotorbikes) {
            throw new Error(`Limit reached for Room Type ${roomType}: Max ${maxMotorbikes} motorbike(s) allowed.`);
        }
        if (vehicleType === 'bicycle' && totalBicycleCount >= maxBicycles) {
            throw new Error(`Limit reached for Room Type ${roomType}: Max ${maxBicycles} bicycle(s) allowed.`);
        }

        await client.query(
            `INSERT INTO vehicle_card_requests (
                resident_id, request_type, vehicle_type, full_name, dob, phone, relationship,
                license_plate, brand, color, proof_image_url, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                residentId, 'register', vehicleType, fullName, dob || null, phone || null, relationship || null,
                licensePlate || null, brand || null, color || null, proofImageUrl, 'pending'
            ]
        );

        const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
        const notificationMessage = `Resident ${residentFullName} has submitted a new vehicle card registration request.`;
        const linkTo = '/admin/vehicle-management';

        for (const admin of admins.rows) {
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [admin.id, notificationMessage, linkTo]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Registration request submitted successfully! Please wait for approval.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error registering vehicle card:', err);
        if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting uploaded file after DB error:", unlinkErr);
            });
        }
        
        if (err.message.includes('assigned an apartment') || err.message.includes('Limit reached')) {
            res.status(403).json({ message: err.message });
        } else {
            res.status(500).json({ message: err.message || 'Server error.' });
        }
    } finally {
        client.release();
    }
});

// POST /api/services/reissue-card
router.post('/reissue-card', protect, async (req, res) => {
    const residentId = req.user.user ? req.user.user.id : req.user.id;
    const residentFullName = req.user.user ? req.user.user.full_name : req.user.full_name;

    if (!residentId || !residentFullName) {
        return res.status(401).json({ message: 'Invalid token or missing user info.' });
    }
    
    const { cardId, reason } = req.body;

    if (!cardId || !reason) {
        return res.status(400).json({ message: 'Missing card info or reason.' });
    }

    const pool = db.getPool ? db.getPool() : db; 
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userCheck = await client.query('SELECT apartment_number FROM users WHERE id = $1', [residentId]);
        if (!userCheck.rows[0]?.apartment_number) {
            throw new Error('You have not been assigned an apartment yet. Please contact Admin.');
        }

        const cardRes = await client.query('SELECT id, vehicle_type, license_plate, brand FROM vehicle_cards WHERE id = $1 AND resident_id = $2 AND status IN ($3, $4)', [cardId, residentId, 'active', 'inactive']);
        if (cardRes.rows.length === 0) {
            throw new Error('Valid card not found.');
        }
        const card = cardRes.rows[0];

        const pendingReq = await client.query('SELECT id FROM vehicle_card_requests WHERE target_card_id = $1 AND status = $2', [cardId, 'pending']);
        if(pendingReq.rows.length > 0) {
             throw new Error('A request is already pending for this card.');
        }

        // INSERT (đã thêm proof_image_url)
        await client.query(
            `INSERT INTO vehicle_card_requests (
                resident_id, request_type, target_card_id, vehicle_type, full_name,
                license_plate, brand, reason, status, proof_image_url
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                residentId, 
                'reissue', 
                cardId, 
                card.vehicle_type, 
                residentFullName, 
                card.license_plate, 
                card.brand, 
                reason, 
                'pending',
                '' // proof_image_url: rỗng
            ]
        );

        const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
        const notificationMessage = `Resident ${residentFullName} has requested to reissue vehicle card (Plate: ${card.license_plate || 'N/A'}).`;
        const linkTo = '/admin/vehicle-management'; 

        for (const admin of admins.rows) {
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [admin.id, notificationMessage, linkTo]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Reissue request submitted successfully!' });
    
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error requesting card reissue:', err);
        
        // [CẬP NHẬT] Xử lý lỗi pending
        if (err.message.includes('assigned an apartment')) {
            res.status(403).json({ message: err.message });
        } else if (err.message.includes('already pending')) {
            res.status(400).json({ message: 'A request is already pending for this card.' });
        } else {
            res.status(500).json({ message: err.message || 'Server error.' });
        }
    } finally {
        client.release();
    }
});

// POST /api/services/cancel-card
router.post('/cancel-card', protect, async (req, res) => {
    // Debug log
    console.log(">>> [DEBUG] Cancel Card Request:", req.body);

    const residentId = req.user.user ? req.user.user.id : req.user.id;
    const residentFullName = req.user.user ? req.user.user.full_name : req.user.full_name;

    if (!residentId || !residentFullName) {
        return res.status(401).json({ message: 'Invalid token or missing user info.' });
    }
    
    const { cardId, reason } = req.body;

    if (!cardId || !reason) {
         return res.status(400).json({ message: 'Missing card info or reason.' });
    }

    const pool = db.getPool ? db.getPool() : db; 
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check user info
        const userCheck = await client.query('SELECT apartment_number FROM users WHERE id = $1', [residentId]);
        if (!userCheck.rows[0]?.apartment_number) {
            throw new Error('You have not been assigned an apartment yet. Please contact Admin.');
        }

        // 2. Check card existence
        const cardRes = await client.query('SELECT id, vehicle_type, license_plate, brand FROM vehicle_cards WHERE id = $1 AND resident_id = $2 AND status IN ($3, $4)', [cardId, residentId, 'active', 'inactive']);
        if (cardRes.rows.length === 0) {
            throw new Error('Valid card not found.');
        }
        const card = cardRes.rows[0];

        // 3. Check duplicate request
        const pendingReq = await client.query('SELECT id FROM vehicle_card_requests WHERE target_card_id = $1 AND status = $2', [cardId, 'pending']);
        if(pendingReq.rows.length > 0) {
            throw new Error('A request is already pending for this card.');
        }

        // INSERT (đã thêm proof_image_url)
        await client.query(
            `INSERT INTO vehicle_card_requests (
                resident_id, request_type, target_card_id, vehicle_type, full_name,
                license_plate, brand, reason, status, proof_image_url
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                residentId, 
                'cancel', 
                cardId, 
                card.vehicle_type, 
                residentFullName,
                card.license_plate || 'N/A', 
                card.brand || 'N/A',         
                reason, 
                'pending',
                '' // proof_image_url: Truyền chuỗi rỗng
            ]
        );

        const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
        const notificationMessage = `Resident ${residentFullName} has requested to cancel vehicle card (Plate: ${card.license_plate || 'N/A'}).`;
        const linkTo = '/admin/vehicle-management'; 

        for (const admin of admins.rows) {
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [admin.id, notificationMessage, linkTo]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Cancellation request submitted successfully!' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error requesting card cancellation:', err); 
        
        // [CẬP NHẬT QUAN TRỌNG] Xử lý lỗi pending để không trả về 500
        if (err.message.includes('assigned an apartment')) {
            res.status(403).json({ message: err.message });
        } else if (err.message.includes('already pending')) {
            // Trả về 400 Bad Request
            res.status(400).json({ message: 'Request pending: You have already submitted a request for this card.' });
        } else {
            res.status(500).json({ message: err.message || 'Server error.' });
        }
    } finally {
        client.release();
    }
});

// POST /api/services/cancel-pending-request
router.post('/cancel-pending-request', protect, async (req, res) => {
    const residentId = req.user.user ? req.user.user.id : req.user.id;
    const residentFullName = req.user.user ? req.user.user.full_name : req.user.full_name; 
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(400).json({ message: 'Request ID is required.' });
    }

    const pool = db.getPool ? db.getPool() : db; 
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const checkQuery = `
            SELECT id, proof_image_url, vehicle_type, license_plate 
            FROM vehicle_card_requests 
            WHERE id = $1 AND resident_id = $2 AND status = 'pending' AND request_type = 'register'
        `;
        const checkRes = await client.query(checkQuery, [requestId, residentId]);

        if (checkRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Pending registration request not found or cannot be cancelled.' });
        }

        const requestToDelete = checkRes.rows[0];

        const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
        const notificationMessage = `Resident ${residentFullName} has CANCELLED their registration request for ${requestToDelete.vehicle_type} (Plate: ${requestToDelete.license_plate || 'N/A'}).`;
        const linkTo = '/admin/vehicle-management';

        for (const admin of admins.rows) {
            await client.query(
                "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                [admin.id, notificationMessage, linkTo]
            );
        }

        await client.query('DELETE FROM vehicle_card_requests WHERE id = $1', [requestId]);

        await client.query('COMMIT');

        if (requestToDelete.proof_image_url) {
            const fileName = path.basename(requestToDelete.proof_image_url);
            const filePath = path.join(__dirname, '../uploads/proofs', fileName); 

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Warning: Could not delete proof image file:", err.message);
                }
            });
        }

        res.json({ message: 'Registration request cancelled successfully.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error cancelling pending request:', err);
        res.status(500).json({ message: 'Server error cancelling request.' });
    } finally {
        client.release();
    }
});

module.exports = router;