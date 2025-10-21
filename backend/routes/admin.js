// backend/routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs'); // Assuming bcryptjs is needed here if isStrongPassword uses it elsewhere or will be added
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Correct import from the updated db.js file
const pool = require('../db').getPool();
const { query } = require('../db'); // Assuming query is exported for simpler queries

const router = express.Router();

// Utility function to check password strength
const isStrongPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

// API TO GET LIST OF ALL USERS
router.get('/users', protect, isAdmin, async (req, res) => {
    try {
        const users = await query(
            // Fetch relevant user details, excluding the current admin
            'SELECT id, full_name, email, role, is_verified, created_at FROM users WHERE id != $1 ORDER BY created_at DESC',
            [req.user.id] // Exclude the logged-in admin from the list
        );
        res.status(200).json(users.rows);
    } catch (error) {
        console.error('Error fetching user list:', error); // Log in English
        res.status(500).json({ message: 'Server error fetching user list.' }); // English message
    }
});

// API TO UPDATE USER INFORMATION
router.put('/users/:id', protect, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { fullName, role, newPassword } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'User not found.' }); // English message
        }

        const setClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        if (fullName !== undefined) {
            setClauses.push(`full_name = $${paramIndex++}`);
            queryParams.push(fullName);
        }
        if (role && ['user', 'resident'].includes(role)) {
            setClauses.push(`role = $${paramIndex++}`);
            queryParams.push(role);
        }
        if (newPassword && newPassword.trim() !== '') {
            if (!isStrongPassword(newPassword)) { // Assuming isStrongPassword is available
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'New password is not strong enough.' }); // English message
            }
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);
            setClauses.push(`password_hash = $${paramIndex++}`);
            queryParams.push(passwordHash);
        }

        if (setClauses.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No information provided to update.' }); // English message
        }

        queryParams.push(id);
        const updateQuery = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

        const updatedUser = await client.query(updateQuery, queryParams);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Update successful!', user: updatedUser.rows[0] }); // English message

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating user:', error); // Log in English
        res.status(500).json({ message: 'Server error updating user.' }); // English message
    } finally {
        client.release();
    }
});

// API TO DELETE A USER
router.delete('/users/:id', protect, isAdmin, async (req, res) => {
    try {
        // Optionally add a check if user exists before deleting
        await query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.status(200).json({ message: 'User deleted successfully.' }); // English message
    } catch (error) {
        console.error('Error deleting user:', error); // Log in English
        res.status(500).json({ message: 'Server error deleting user.' }); // English message
    }
});

// API TO GET LIST OF RESIDENTS (role = 'resident')
router.get('/residents', protect, isAdmin, async (req, res) => {
    try {
        const residents = await query(
            // apartment_number will be null if not yet assigned
            "SELECT id, full_name, email, apartment_number FROM users WHERE role = 'resident' ORDER BY full_name"
        );
        res.status(200).json(residents.rows);
    } catch (error) {
        console.error('Error fetching resident list:', error); // Log in English
        res.status(500).json({ message: 'Server error fetching resident list.' }); // English message
    }
});

// API TO GET LIST OF BLOCKS
router.get('/blocks', protect, isAdmin, async (req, res) => {
    try {
        const blocks = await query("SELECT id, name FROM blocks ORDER BY name");
        res.status(200).json(blocks.rows);
    } catch (error) {
        console.error('Error fetching block list:', error); // Log in English
        res.status(500).json({ message: 'Server error fetching block list.' }); // English message
    }
});

// API TO GET AVAILABLE ROOMS IN A BLOCK
router.get('/blocks/:blockId/available-rooms', protect, isAdmin, async (req, res) => {
    const { blockId } = req.params;
    try {
        const rooms = await query(
            "SELECT id, room_number, floor FROM rooms WHERE block_id = $1 AND resident_id IS NULL ORDER BY floor, room_number",
            [blockId]
        );
        res.status(200).json(rooms.rows);
    } catch (error) {
        console.error('Error fetching available rooms:', error); // Log in English
        res.status(500).json({ message: 'Server error fetching available rooms.' }); // English message
    }
});

// API TO ASSIGN A RESIDENT TO A ROOM
router.post('/assign-room', protect, isAdmin, async (req, res) => {
    const { residentId, roomId } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get room and block info to create the full apartment name (e.g., "A - 101")
        // Lock the room row to prevent race conditions
        const roomInfo = await client.query(
            "SELECT r.room_number, b.name as block_name FROM rooms r JOIN blocks b ON r.block_id = b.id WHERE r.id = $1 AND r.resident_id IS NULL FOR UPDATE",
            [roomId]
        );

        if (roomInfo.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Room does not exist or is already occupied.' }); // English message
        }

        // Step 1: Unassign this resident from any previous room (if applicable)
        await client.query("UPDATE rooms SET resident_id = NULL WHERE resident_id = $1", [residentId]);

        // Step 2: Assign resident to the new room
        await client.query("UPDATE rooms SET resident_id = $1 WHERE id = $2", [residentId, roomId]);

        // Step 3: Update the 'apartment_number' column in the 'users' table
        const apartmentFullName = `${roomInfo.rows[0].block_name} - ${roomInfo.rows[0].room_number}`;
        await client.query("UPDATE users SET apartment_number = $1 WHERE id = $2", [apartmentFullName, residentId]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Room assigned successfully!' }); // English message

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error assigning room:", error); // Log in English
        res.status(500).json({ message: 'Server error assigning room.' }); // English message
    } finally {
        client.release();
    }
});

// API TO GET ALL ROOMS IN A BLOCK (including resident info if occupied)
router.get('/blocks/:blockId/rooms', protect, isAdmin, async (req, res) => {
    const { blockId } = req.params;
    try {
        // Use LEFT JOIN to get both empty and occupied rooms
        const rooms = await query(
            `SELECT
                r.id,
                r.room_number,
                r.floor,
                r.status,
                u.full_name as resident_name
             FROM rooms r
             LEFT JOIN users u ON r.resident_id = u.id
             WHERE r.block_id = $1
             ORDER BY r.floor ASC, r.room_number ASC`,
            [blockId]
        );
        res.status(200).json(rooms.rows);
    } catch (error) {
        console.error("Error fetching room list:", error); // Log in English
        res.status(500).json({ message: 'Server error fetching room list.' }); // English message
    }
});

module.exports = router;