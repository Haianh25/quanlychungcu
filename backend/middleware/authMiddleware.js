const jwt = require('jsonwebtoken');
const db = require('../db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Get token from header
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Get user from DB (Updated to select is_active)
            const result = await db.query(
                'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1', 
                [decoded.id]
            );

            if (result.rows.length > 0) {
                req.user = result.rows[0];

                // --- [NEW] CHECK IF ACCOUNT IS DISABLED ---
                // This prevents locked users from accessing any protected API
                if (req.user.is_active === false) {
                    return res.status(403).json({ message: 'Your account has been disabled. Please contact support.' });
                }
                // ------------------------------------------

                next();
            } else {
                res.status(401).json({ message: 'User not found.' });
            }

        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token.' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};

module.exports = { protect, isAdmin };