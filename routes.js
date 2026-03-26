import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import oracledb from 'oracledb';
import multer from 'multer';
import path from 'path';
import { getPool } from './db.js';

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|mov/;
        const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mime = allowedTypes.test(file.mimetype);
        if (ext || mime) return cb(null, true);
        cb(new Error('Only image and video files are allowed'));
    }
});

// Helper to log activity
async function logActivity(userId, action, details) {
    if (!userId) return;
    try {
        const pool = getPool();
        const connection = await pool.getConnection();
        await connection.execute(
            `INSERT INTO Activity_Logs (user_id, action, details) VALUES (:userId, :action, :details)`,
            { userId, action, details },
            { autoCommit: true }
        );
        await connection.close();
    } catch (err) {
        console.error('Failed to log activity:', err);
    }
}

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOTP(email, otp) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Meme Collection',
            text: `Your OTP is: ${otp}. It is valid for 10 minutes.`
        });
    } catch (err) {
        console.error('Failed to send email:', err);
    }
}

// Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET || 'supersecret123', (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
}

// --- AUTH ROUTES ---

router.post('/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    let connection;
    try {
        const pool = getPool();
        connection = await pool.getConnection();

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user
        const result = await connection.execute(
            `INSERT INTO Users (name, email, password_hash, is_verified) VALUES (:name, :email, :password, 0) RETURNING user_id INTO :userId`,
            { name, email, password: hashedPassword, userId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } },
            { autoCommit: true }
        );
        
        const userId = result.outBinds.userId[0];

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

        await connection.execute(
            `INSERT INTO OTP_Logs (email, otp_code, expires_at, is_used) VALUES (:email, :otp, :expiresAt, 0)`,
            { email, otp, expiresAt },
            { autoCommit: true }
        );

        // Send OTP
        await sendOTP(email, otp);
        await logActivity(userId, 'REGISTER', 'User registered, OTP sent');

        res.status(201).json({ message: 'User registered. Please check email for OTP.' });
    } catch (err) {
        if (err.code === 'ORA-00001') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

router.post('/auth/verify', async (req, res) => {
    const { email, otp } = req.body;
    let connection;
    try {
        const pool = getPool();
        connection = await pool.getConnection();

        // Check OTP
        const result = await connection.execute(
            `SELECT * FROM (SELECT otp_id, expires_at, is_used FROM OTP_Logs WHERE email = :email AND otp_code = :otp ORDER BY created_at DESC) WHERE ROWNUM <= 1`,
            { email, otp }
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        const [otpId, expiresAt, isUsed] = result.rows[0];

        if (isUsed === 1) return res.status(400).json({ error: 'OTP already used' });
        if (new Date() > expiresAt) return res.status(400).json({ error: 'OTP expired' });

        // Mark OTP used and User verified
        await connection.execute(
            `UPDATE OTP_Logs SET is_used = 1 WHERE otp_id = :otpId`,
            { otpId },
            { autoCommit: false }
        );

        await connection.execute(
            `UPDATE Users SET is_verified = 1 WHERE email = :email`,
            { email },
            { autoCommit: true }
        );

        // Get user for token
        const userRes = await connection.execute(
            `SELECT user_id, name FROM Users WHERE email = :email`,
            { email }
        );
        
        const [userId, name] = userRes.rows[0];
        await logActivity(userId, 'VERIFY_OTP', 'User successfully verified email');

        const token = jwt.sign({ userId, email, name }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '24h' });

        res.json({ message: 'Email verified successfully', token, user: { userId, name, email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    let connection;
    try {
        const pool = getPool();
        connection = await pool.getConnection();

        const result = await connection.execute(
            `SELECT user_id, name, password_hash, is_verified FROM Users WHERE email = :email`,
            { email }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const [userId, name, hash, isVerified] = result.rows[0];

        const match = await bcrypt.compare(password, hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (isVerified === 0) {
            // Unverified, resend OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60000);
            await connection.execute(
                `INSERT INTO OTP_Logs (email, otp_code, expires_at, is_used) VALUES (:email, :otp, :expiresAt, 0)`,
                { email, otp, expiresAt },
                { autoCommit: true }
            );
            await sendOTP(email, otp);
            return res.status(403).json({ error: 'Email not verified. A new OTP has been sent.' });
        }

        await logActivity(userId, 'LOGIN', 'User logged in');
        const token = jwt.sign({ userId, email, name }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '24h' });

        res.json({ token, user: { userId, name, email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

// --- CATEGORIES ROUTES ---

router.get('/categories', async (req, res) => {
    let connection;
    try {
        const pool = getPool();
        connection = await pool.getConnection();
        const result = await connection.execute(
            `SELECT category_id, name, description FROM Categories ORDER BY name ASC`
        );
        const categories = result.rows.map(row => ({
            id: row[0],
            name: row[1],
            description: row[2]
        }));
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

// --- MEMES ROUTES ---

router.get('/memes', async (req, res) => {
    let connection;
    const { q, sort, categoryId, userId } = req.query;
    try {
        const pool = getPool();
        connection = await pool.getConnection();

        let sql = `
            SELECT m.meme_id, m.title, m.image_url, m.description, m.created_at, u.name as author, c.name as category, m.meme_type, m.user_id,
                   (SELECT COUNT(*) FROM Likes l WHERE l.meme_id = m.meme_id) as like_count,
                   (SELECT COUNT(*) FROM Comments cm WHERE cm.meme_id = m.meme_id) as comment_count
            FROM Memes m
            JOIN Users u ON m.user_id = u.user_id
            LEFT JOIN Categories c ON m.category_id = c.category_id
            WHERE 1=1
        `;

        const binds = {};
        if (q) {
            sql += ` AND (LOWER(m.title) LIKE :q OR LOWER(m.description) LIKE :q)`;
            binds.q = `%${q.toLowerCase()}%`;
        }
        if (categoryId) {
            sql += ` AND m.category_id = :categoryId`;
            binds.categoryId = parseInt(categoryId);
        }
        if (userId) {
            sql += ` AND m.user_id = :userId`;
            binds.userId = parseInt(userId);
        }

        if (sort === 'trending') {
            sql += ` ORDER BY like_count DESC, m.created_at DESC`;
        } else {
            sql += ` ORDER BY m.created_at DESC`;
        }

        const result = await connection.execute(sql, binds);
        const memes = result.rows.map(row => ({
            id: row[0],
            title: row[1],
            imageUrl: row[2],
            description: row[3],
            createdAt: row[4],
            author: row[5],
            category: row[6],
            memeType: row[7] || 'image',
            userId: row[8],
            likeCount: row[9] || 0,
            commentCount: row[10] || 0
        }));
        res.json(memes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

router.post('/memes', authenticateToken, upload.single('file'), async (req, res) => {
    const { title, description, categoryId, memeType } = req.body;
    const type = memeType || 'image';
    let fileUrl = req.body.imageUrl || null;

    // For file uploads, use the uploaded file path
    if (req.file) {
        fileUrl = `/uploads/${req.file.filename}`;
    }

    // For text memes, no file is required
    if (type === 'text') {
        fileUrl = null;
    } else if (!fileUrl && !req.file) {
        return res.status(400).json({ error: 'File or image URL is required for image/video memes' });
    }

    let connection;
    try {
        const pool = getPool();
        connection = await pool.getConnection();
        await connection.execute(
            `INSERT INTO Memes (user_id, category_id, title, image_url, description, meme_type) 
             VALUES (:userId, :categoryId, :title, :imageUrl, :description, :memeType)`,
            { userId: req.user.userId, categoryId, title, imageUrl: fileUrl, description, memeType: type },
            { autoCommit: true }
        );
        await logActivity(req.user.userId, 'CREATE_MEME', `User created ${type} meme: ${title}`);
        res.status(201).json({ message: 'Meme created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

router.put('/memes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, imageUrl, description, categoryId } = req.body;
    let connection;
    try {
        const pool = getPool();
        connection = await pool.getConnection();

        // Check ownership
        const check = await connection.execute(
            `SELECT user_id FROM Memes WHERE meme_id = :id`,
            { id }
        );

        if (check.rows.length === 0) return res.status(404).json({ error: 'Meme not found' });
        if (check.rows[0][0] !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

        await connection.execute(
            `UPDATE Memes SET title = :title, image_url = :imageUrl, description = :description, category_id = :categoryId, updated_at = CURRENT_TIMESTAMP 
             WHERE meme_id = :id`,
            { title, imageUrl, description, categoryId, id },
            { autoCommit: true }
        );
        
        await logActivity(req.user.userId, 'UPDATE_MEME', `User updated meme ID: ${id}`);
        res.json({ message: 'Meme updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

router.delete('/memes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        const pool = getPool();
        connection = await pool.getConnection();

        const check = await connection.execute(
            `SELECT user_id FROM Memes WHERE meme_id = :id`,
            { id }
        );

        if (check.rows.length === 0) return res.status(404).json({ error: 'Meme not found' });
        if (check.rows[0][0] !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

        await connection.execute(
            `DELETE FROM Memes WHERE meme_id = :id`,
            { id },
            { autoCommit: true }
        );
        
        await logActivity(req.user.userId, 'DELETE_MEME', `User deleted meme ID: ${id}`);
        res.json({ message: 'Meme deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

// --- STATS / REPORTS ---

router.get('/stats/categories', async (req, res) => {
    let connection;
    try {
        const pool = getPool();
        connection = await pool.getConnection();
        const result = await connection.execute(
            `SELECT c.name, COUNT(m.meme_id) as count 
             FROM Categories c 
             LEFT JOIN Memes m ON c.category_id = m.category_id 
             GROUP BY c.name 
             ORDER BY count DESC`
        );
        const stats = result.rows.map(row => ({
            category: row[0],
            count: row[1]
        }));
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

// ============ LIKES & COMMENTS ============

// Toggle like
router.post('/memes/:id/like', authenticateToken, async (req, res) => {
    const memeId = req.params.id;
    let connection;
    try {
        const pool = getPool();
        connection = await pool.getConnection();

        // Check if already liked
        const existing = await connection.execute(
            `SELECT like_id FROM Likes WHERE user_id = :userId AND meme_id = :memeId`,
            { userId: req.user.userId, memeId }
        );

        if (existing.rows.length > 0) {
            // Unlike
            await connection.execute(
                `DELETE FROM Likes WHERE user_id = :userId AND meme_id = :memeId`,
                { userId: req.user.userId, memeId },
                { autoCommit: true }
            );
            res.json({ liked: false });
        } else {
            // Like
            await connection.execute(
                `INSERT INTO Likes (user_id, meme_id) VALUES (:userId, :memeId)`,
                { userId: req.user.userId, memeId },
                { autoCommit: true }
            );
            res.json({ liked: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

// Get comments for a meme
router.get('/memes/:id/comments', async (req, res) => {
    const memeId = req.params.id;
    let connection;
    try {
        const pool = getPool();
        connection = await pool.getConnection();
        const result = await connection.execute(
            `SELECT c.comment_id, c.content, c.created_at, u.name as author
             FROM Comments c
             JOIN Users u ON c.user_id = u.user_id
             WHERE c.meme_id = :memeId
             ORDER BY c.created_at ASC`,
            { memeId }
        );
        const comments = result.rows.map(row => ({
            id: row[0],
            content: row[1],
            createdAt: row[2],
            author: row[3]
        }));
        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

// Post a comment
router.post('/memes/:id/comments', authenticateToken, async (req, res) => {
    const memeId = req.params.id;
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Comment content is required' });
    }
    let connection;
    try {
        const pool = getPool();
        connection = await pool.getConnection();
        await connection.execute(
            `INSERT INTO Comments (user_id, meme_id, content) VALUES (:userId, :memeId, :content)`,
            { userId: req.user.userId, memeId, content: content.trim() },
            { autoCommit: true }
        );
        await logActivity(req.user.userId, 'ADD_COMMENT', `Commented on meme ${memeId}`);
        res.status(201).json({ message: 'Comment added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

// ============ USER PROFILE ============

// Update user profile
router.put('/users/profile', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { name } = req.body;
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Name is required' });
        }
        connection = await getPool().getConnection();
        await connection.execute(
            `UPDATE Users SET name = :name WHERE user_id = :userId`,
            { name: name.trim(), userId: req.user.userId },
            { autoCommit: true }
        );
        await logActivity(req.user.userId, 'PROFILE_UPDATE', `Updated name to ${name.trim()}`);
        res.json({ message: 'Profile updated successfully', user: { userId: req.user.userId, name: name.trim(), email: req.user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

export default router;
