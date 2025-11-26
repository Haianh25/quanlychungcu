// backend/utils/mailer.js
const nodemailer = require('nodemailer');

// Create a "transporter" object responsible for sending emails
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// Function to send verification email
const sendVerificationEmail = async (email, token) => {
    // Link that the user will click in the email
    const verificationLink = `http://localhost:3000/verify-email/${token}`;

    const mailOptions = {
        from: '"Apartment Management" <no-reply@quanlychungcu.com>', // Sender address
        to: email, // Receiver address
        subject: 'Verify your account', // Email subject
        html: `
            <p>Hello,</p>
            <p>Thank you for registering. Please click the link below to activate your account:</p>
            <a href="${verificationLink}" target="_blank" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Activate Account</a>
            <p>If you did not request this, please ignore this email.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
        // Throw error so the calling function can handle it
        throw new Error('Could not send verification email.');
    }
};

const sendPasswordResetEmail = async (email, token) => {
    const resetLink = `http://localhost:3000/reset-password/${token}`;

    const mailOptions = {
        from: '"Apartment Management" <no-reply@quanlychungcu.com>',
        to: email,
        subject: 'Password Reset Request',
        html: `
            <p>Hello,</p>
            <p>You have requested to reset your password. Please click the link below to continue. This link will expire in 1 hour.</p>
            <a href="${resetLink}" target="_blank" style="padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If you did not request this, please ignore this email.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent to:', email);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Could not send password reset email.');
    }
};

// --- (NEW) Function to send new bill notification email ---
/**
 * Sends a new bill notification email.
 * @param {string} email - Receiver email
 * @param {string} fullName - Receiver full name
 * @param {object} billDetails - Bill details
 * @param {number} billDetails.billId - Bill ID
 * @param {string} billDetails.monthYear - Bill Month/Year (e.g., "11/2025")
 * @param {number} billDetails.totalAmount - Total amount
 * @param {string} billDetails.dueDate - Due date (formatted)
 */
const sendNewBillEmail = async (email, fullName, billDetails) => {
    const { billId, monthYear, totalAmount, dueDate } = billDetails;
    
    // Format amount nicely
    const formattedAmount = totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    const paymentLink = `http://localhost:3000/bill`; // Link to bill page

    const mailOptions = {
        from: '"Apartment Management" <no-reply@quanlychungcu.com>',
        to: email,
        subject: `Bill Notification for ${monthYear} - Invoice #${billId}`,
        html: `
            <p>Hello ${fullName},</p>
            <p>The management board would like to inform you that your service bill for <b>${monthYear}</b> has been issued.</p>
            
            <div style="padding: 15px; background-color: #f4f4f4; border-radius: 5px;">
                <p><b>Invoice ID:</b> #${billId}</p>
                <p><b>Total Amount:</b> <span style="color: #dc3545; font-weight: bold;">${formattedAmount}</span></p>
                <p><b>Due Date:</b> ${dueDate}</p>
            </div>
            
            <p>Please visit the resident portal to view details and pay before the due date.</p>
            
            <a href="${paymentLink}" target="_blank" style="display: inline-block; padding: 12px 25px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                View and Pay Bill
            </a>
            
            <p style="margin-top: 20px; font-size: 0.9em; color: #777;">
                Thank you.<br>
                PTIT Apartment Management Board
            </p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Bill notification email #${billId} sent to:`, email);
    } catch (error) {
        console.error(`Error sending bill email #${billId} to ${email}:`, error);
        // Throw error so billService can handle it (or ignore)
        throw new Error('Could not send bill notification email.');
    }
};
// --- (END NEW) ---

// EXPORT: Add new function to exports
module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendNewBillEmail };