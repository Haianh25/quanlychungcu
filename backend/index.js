const express = require('express');
const cors = require('cors');
const db = require('./db'); 
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news');
const vehicleAdminRoutes = require('./routes/vehicleAdmin');
const fs = require('fs');
const path = require('path');
const profileRoutes = require('./routes/profile');
const billUserRoutes = require('./routes/billUser');
const notificationRoutes = require('./routes/notifications');
const billAdminRoutes = require('./routes/billAdmin'); 
const feeAdminRoutes = require('./routes/feeAdmin'); 
const paymentRoutes = require('./routes/payment'); 
const serviceRoutes = require('./routes/services'); 
const amenityAdminRoutes = require('./routes/amenityAdmin');
const amenityUserRoutes = require('./routes/amenityUser');
const dashboardRoutes = require('./routes/dashboard');
require('./cron'); 

const app = express();

console.log('--- DATABASE CONNECTION ACTIVE ---');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));
console.log(`Serving static files from ${uploadsDir} at /uploads`);

const adminMasterRouter = express.Router();
adminMasterRouter.use(adminRoutes); 
adminMasterRouter.use(vehicleAdminRoutes); 
adminMasterRouter.use('/bills', billAdminRoutes); 
adminMasterRouter.use('/fees', feeAdminRoutes); 
adminMasterRouter.use('/amenities', amenityAdminRoutes);
adminMasterRouter.use('/dashboard', dashboardRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/bills', billUserRoutes); 
app.use('/api/notifications', notificationRoutes);
app.use('/api/payment', paymentRoutes); 
app.use('/api/services', serviceRoutes); 
app.use('/api/amenities', amenityUserRoutes);

app.use('/api/admin', adminMasterRouter); 

app.get('/', (req, res) => {
    res.send('Welcome to the Apartment Management API!');
});


app.get('/test-db', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.status(200).json({
            message: 'Database connection successful!',
            time: result.rows[0].now,
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            message: 'Error connecting to database!',
            error: error.message,
        });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});