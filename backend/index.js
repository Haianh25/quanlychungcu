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

// --- REALTIME & SERVER IMPORTS ---
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// --- SWAGGER IMPORTS ---
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const server = http.createServer(app); // Wrap express app with HTTP server

console.log('--- DATABASE CONNECTION ACTIVE ---');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- SOCKET.IO SETUP ---
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Allow frontend connection
        methods: ["GET", "POST"]
    }
});

// Map to store connected users: userId -> socketId
const userSocketMap = {}; 

// Middleware to verify JWT for Socket connection
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error("Authentication error: Token required"));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error("Authentication error: Invalid token"));
        socket.user = decoded; // Attach decoded user info to socket
        next();
    });
});

io.on('connection', (socket) => {
    const userId = socket.user.id || socket.user.user?.id || socket.user.userId;
    const userRole = socket.user.role || socket.user.roles || 'unknown'; 
    
    if (!userId) {
        console.error("Socket connected but NO USER ID found in token:", socket.user);
        return; 
    }

    console.log(`User connected: ${userId} (Role: ${userRole}) - Socket ID: ${socket.id}`);
    
    // Store user connection
    userSocketMap[userId] = socket.id;

    // --- CHAT EVENTS ---

    // 1. Gửi tin nhắn
    socket.on('send_message', async ({ receiver_id, message }) => {
        console.log(`[Chat] ${userId} sends to ${receiver_id}: "${message}"`);
        
        try {
            // Lưu vào DB
            const result = await db.query(
                `INSERT INTO messages (sender_id, receiver_id, message, created_at) 
                 VALUES ($1, $2, $3, NOW()) 
                 RETURNING *`,
                [userId, receiver_id, message]
            );
            const newMessage = result.rows[0];

            // Gửi cho người nhận (nếu online)
            const receiverSocketId = userSocketMap[receiver_id];
            
            if (receiverSocketId) {
                console.log(`---> Delivering to socket: ${receiverSocketId}`);
                io.to(receiverSocketId).emit('receive_message', newMessage);
            } else {
                console.log(`---> User ${receiver_id} is OFFLINE (Not in userSocketMap)`);
            }

            // Gửi lại cho chính người gửi (để cập nhật UI ngay lập tức - xác nhận đã gửi)
            socket.emit('receive_message', newMessage);

        } catch (err) {
            console.error("Error sending message:", err);
        }
    });

    // 2. Lấy lịch sử chat với một người cụ thể
    socket.on('get_conversation', async ({ partner_id }) => {
        try {
            const result = await db.query(
                `SELECT * FROM messages 
                 WHERE (sender_id = $1 AND receiver_id = $2) 
                    OR (sender_id = $2 AND receiver_id = $1)
                 ORDER BY created_at ASC`,
                [userId, partner_id]
            );
            socket.emit('conversation_history', result.rows);
        } catch (err) {
            console.error("Error fetching conversation:", err);
        }
    });

    // 3. (Dành cho Admin) Lấy danh sách những người đã nhắn tin + SỐ TIN CHƯA ĐỌC
    socket.on('get_chat_partners', async () => {
        try {
            // Logic: Lấy danh sách user và đếm số tin nhắn họ gửi cho mình mà mình chưa đọc (is_read = false)
            const result = await db.query(
                `SELECT DISTINCT u.id, u.full_name, u.email, u.role,
                 (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.id AND m.receiver_id = $1 AND m.is_read = false) as unread_count
                 FROM users u
                 JOIN messages m ON (m.sender_id = u.id OR m.receiver_id = u.id)
                 WHERE u.id != $1
                 ORDER BY unread_count DESC, u.id ASC`,
                 [userId]
            );
            socket.emit('chat_partners_list', result.rows);
        } catch (err) {
            console.error("Error fetching chat partners:", err);
        }
    });

    // 4. (Dành cho Resident) Tìm ID của Admin để chat
    socket.on('find_admin_to_chat', async () => {
        try {
            const result = await db.query("SELECT id, full_name FROM users WHERE role = 'admin' LIMIT 1");
            if(result.rows.length > 0) {
                socket.emit('admin_info', result.rows[0]);
            }
        } catch (err) {
            console.error("Error finding admin:", err);
        }
    });

    // 5. (MỚI) Đánh dấu đã đọc
    socket.on('mark_read', async ({ sender_id }) => {
        try {
            // Update tất cả tin nhắn từ sender_id gửi cho tôi thành đã đọc
            await db.query(
                `UPDATE messages SET is_read = true 
                 WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
                [sender_id, userId]
            );
        } catch (err) {
            console.error("Error marking read:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
        delete userSocketMap[userId];
    });
});

// Make io and userSocketMap accessible globally (or via req.app.get)
global.io = io;
global.userSocketMap = userSocketMap;

const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));
console.log(`Serving static files from ${uploadsDir} at /uploads`);

// --- SWAGGER CONFIG ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Apartment Management API',
            version: '1.0.0',
            description: 'API Documentation for Apartment Management System',
        },
        servers: [
            {
                url: 'http://localhost:5000/api', 
                description: 'Local Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'], // Scan routes folder for Swagger comments
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});