const jwt = require('jsonwebtoken');
const db = require('../db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {    
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const result = await db.query(
                'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1', 
                [decoded.id]
            );

            if (result.rows.length > 0) {
                const dbUser = result.rows[0];
                if (dbUser.is_active === false) {
                    return res.status(403).json({ message: 'Your account has been disabled. Please contact support.' });
                }
                if (decoded.role !== dbUser.role) {
                    return res.status(401).json({ message: 'Session expired. Role updated. Please login again.' });
                }

                req.user = dbUser;
                next();
            } else {
                res.status(401).json({ message: 'User not found.' });
            }

        } catch (error) {
            console.error('Auth Middleware Error:', error.message);
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