// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Correctly combined mailer import line
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

const router = express.Router();

// Function to check password strength
const isStrongPassword = (password) => {
    // Requires at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

// REGISTRATION API
router.post('/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        // Changed message to English
        return res.status(400).json({ message: 'Please fill in all required fields.' });
    }
    if (!isStrongPassword(password)) {
        return res.status(400).json({
            // Changed message to English
            message: 'Password is not strong enough. It must be at least 8 characters long, including uppercase, lowercase, number, and special character.'
        });
    }
    try {
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            // Changed message to English
            return res.status(409).json({ message: 'Email is already in use.' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const newUser = await db.query(
            'INSERT INTO users (full_name, email, password_hash, verification_token) VALUES ($1, $2, $3, $4) RETURNING id, email',
            [fullName, email, passwordHash, verificationToken]
        );
        await sendVerificationEmail(newUser.rows[0].email, verificationToken);
        // Changed message to English
        res.status(201).json({ message: 'Registration successful! Please check your email to activate your account.' });
    } catch (error) {
        // Changed console log to English
        console.error('Error during registration:', error);
        // Changed message to English
        res.status(500).json({ message: 'Server error occurred during registration.' });
    }
});

// EMAIL VERIFICATION API
router.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const user = await db.query('SELECT * FROM users WHERE verification_token = $1', [token]);
        if (user.rows.length === 0) {
             // Changed message to English (as requested previously)
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }
        await db.query('UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1', [user.rows[0].id]);
        // Changed message to English
        res.status(200).json({ message: 'Account verification successful!' });
    } catch (error) {
        // Changed console log to English
        console.error('Error during email verification:', error);
        // Changed message to English
        res.status(500).json({ message: 'Server error during email verification.' });
    }
});

// LOGIN API
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        // Changed message to English
        return res.status(400).json({ message: 'Please enter both email and password.' });
    }
    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            // Changed message to English
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }
        const foundUser = user.rows[0];
        if (!foundUser.is_verified) {
             // Changed message to English
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }
        const isPasswordCorrect = await bcrypt.compare(password, foundUser.password_hash);
        if (!isPasswordCorrect) {
            // Changed message to English
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }
        const token = jwt.sign({ id: foundUser.id, email: foundUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Kept token expiry as 1h, can change if needed
        // Changed message to English
        res.status(200).json({ message: 'Login successful!', token: token });
    } catch (error) {
        // Changed console log to English
        console.error('Error during login:', error);
        // Changed message to English
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// FORGOT PASSWORD REQUEST API
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        // Security best practice: Always return a success-like message even if email not found
        if (user.rows.length === 0) {
            // Changed message to English
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour later
        await db.query('UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3', [resetToken, expires, email]);
        await sendPasswordResetEmail(email, resetToken);
         // Changed message to English
        res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        // Changed console log to English
        console.error('Error in forgot-password:', error);
         // Changed message to English
        res.status(500).json({ message: 'Server error.' });
    }
});

// RESET PASSWORD API
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    if (!isStrongPassword(newPassword)) {
        // Changed message to English
        return res.status(400).json({ message: 'New password is not strong enough.' });
    }
    try {
        const user = await db.query('SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()', [token]);
        if (user.rows.length === 0) {
            // Changed message to English
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        await db.query('UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2', [passwordHash, user.rows[0].id]);
        // Changed message to English
        res.status(200).json({ message: 'Password has been reset successfully!' });
    } catch (error) {
        // Changed console log to English
        console.error('Error in reset-password:', error);
        // Changed message to English
        res.status(500).json({ message: 'Server error.' });
    }
});

// ADMIN LOGIN API
router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        // Changed message to English
        return res.status(400).json({ message: 'Please enter both email and password.' });
    }

    try {
        // 1. Find user by email
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
             // Changed message to English
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }

        const foundUser = user.rows[0];

        // 2. CHECK ADMIN ROLE
        if (foundUser.role !== 'admin') {
            // Changed message to English
            return res.status(403).json({ message: 'Access denied. Account does not have admin privileges.' });
        }

        // 3. Compare password
        const isPasswordCorrect = await bcrypt.compare(password, foundUser.password_hash);
        if (!isPasswordCorrect) {
            // Changed message to English
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }

        // 4. Create JWT with role information
        const token = jwt.sign(
            {
                id: foundUser.id,
                email: foundUser.email,
                role: foundUser.role // Include role in token
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' } // Updated expiry to 2 hours
        );

        res.status(200).json({
            // Changed message to English
            message: 'Admin login successful!',
            token: token,
        });

    } catch (error) {
        // Changed console log to English
        console.error('Error during admin login:', error);
         // Changed message to English
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;