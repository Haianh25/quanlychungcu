const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');

const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

const router = express.Router();

const isStrongPassword = (password) => {
    // Requires at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

router.post('/register', async (req, res) => {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone) {
        return res.status(400).json({ message: 'Please fill in all required fields.' });
    }
    if (!isStrongPassword(password)) {
        return res.status(400).json({
            message: 'Password is not strong enough. It must be at least 8 characters long, including uppercase, lowercase, number, and special character.'
        });
    }
    try {
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'Email is already in use.' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        const newUser = await db.query(
            'INSERT INTO users (full_name, email, password_hash, verification_token, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
            [fullName, email, passwordHash, verificationToken, phone]
        );

        await sendVerificationEmail(newUser.rows[0].email, verificationToken);
        res.status(201).json({ message: 'Registration successful! Please check your email to activate your account.' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error occurred during registration.' });
    }
});

router.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const userResult = await db.query('SELECT * FROM users WHERE verification_token = $1', [token]);
        
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }
        
        const user = userResult.rows[0];

        await db.query('UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1', [user.id]);

        try {
            const admins = await db.query("SELECT id FROM users WHERE role = 'admin'");
            const notificationMessage = `New user '${user.full_name}' (email: ${user.email}) has verified their email.`;
            const linkTo = '/admin/user-management'; 

            for (const admin of admins.rows) {
                await db.query(
                    "INSERT INTO notifications (user_id, message, link_to) VALUES ($1, $2, $3)",
                    [admin.id, notificationMessage, linkTo]
                );
            }
        } catch (notifyError) {
            console.error('Error notifying admin:', notifyError);
        }

        res.status(200).json({ message: 'Account verification successful!' });

    } catch (error) {
        console.error('Error during email verification:', error);
        res.status(500).json({ message: 'Server error during email verification.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter both email and password.' });
    }
    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }
        const foundUser = user.rows[0];
        
        if (foundUser.is_active === false) {
             return res.status(403).json({ message: 'Your account has been disabled. Please contact support.' });
        }

        if (!foundUser.is_verified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }
        const isPasswordCorrect = await bcrypt.compare(password, foundUser.password_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }
        
        const token = jwt.sign(
            {
                id: foundUser.id,
                email: foundUser.email,
                role: foundUser.role,
                full_name: foundUser.full_name,
                avatar_url: foundUser.avatar_url || null,
                apartment_number: foundUser.apartment_number || null 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.status(200).json({ message: 'Login successful!', token: token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour later
        await db.query('UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3', [resetToken, expires, email]);
        await sendPasswordResetEmail(email, resetToken);
        res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error('Error in forgot-password:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    if (!isStrongPassword(newPassword)) {
        return res.status(400).json({ message: 'New password is not strong enough.' });
    }
    try {
        const user = await db.query('SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()', [token]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        await db.query('UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2', [passwordHash, user.rows[0].id]);
        res.status(200).json({ message: 'Password has been reset successfully!' });
    } catch (error) {
        console.error('Error in reset-password:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter both email and password.' });
    }
    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }
        const foundUser = user.rows[0];
        if (foundUser.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Account does not have admin privileges.' });
        }
        const isPasswordCorrect = await bcrypt.compare(password, foundUser.password_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }
        const token = jwt.sign(
            {
                id: foundUser.id,
                email: foundUser.email,
                role: foundUser.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );
        res.status(200).json({
            message: 'Admin login successful!',
            token: token,
        });
    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;