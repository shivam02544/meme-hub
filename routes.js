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

async function sendOTP(email, otp, type = 'verify') {
    const isReset = type === 'reset';
    const subject = isReset
        ? '🔐 MemeHub Password Reset — Don\'t Ghost Us!'
        : '🎭 MemeHub OTP — Your Secret Meme Pass Has Arrived!';

    const html = isReset ? `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#1a1a2e;color:#e0e0e0;border-radius:12px;overflow:hidden;">
            <div style="background:#e94560;padding:24px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:2rem;">🔐 MemeHub</h1>
                <p style="margin:4px 0 0;color:#ffd;font-size:0.95rem;">Password Reset Request</p>
            </div>
            <div style="padding:28px 32px;">
                <p style="font-size:1.1rem;">Yo! Someone (hopefully you 👀) wants to reset their password.</p>
                <p>If it wasn't you — just ignore this email and go back to scrolling memes. 🙃</p>
                <p style="font-size:1rem;margin-top:20px;">Your reset OTP is:</p>
                <div style="background:#0f3460;border-radius:10px;padding:20px;text-align:center;margin:16px 0;">
                    <span style="font-size:2.8rem;font-weight:bold;letter-spacing:10px;color:#e94560;">${otp}</span>
                </div>
                <p style="color:#aaa;font-size:0.85rem;">⏰ This code expires in <strong>10 minutes</strong>. Don't let it die like your motivation on Mondays.</p>
                <hr style="border-color:#333;margin:24px 0;">
                <p style="color:#666;font-size:0.8rem;text-align:center;">MemeHub — Where every day is a meme day 😂</p>
            </div>
        </div>` : `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#1a1a2e;color:#e0e0e0;border-radius:12px;overflow:hidden;">
            <div style="background:#e94560;padding:24px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:2rem;">🎭 MemeHub</h1>
                <p style="margin:4px 0 0;color:#ffd;font-size:0.95rem;">Where memes are life and life is memes</p>
            </div>
            <div style="padding:28px 32px;">
                <p style="font-size:1.1rem;">Ayo! 👋 Welcome to the dankest corner of the internet.</p>
                <p>Before you start blessing us with your meme collection, we need to make sure you're a real human and not a bot trying to steal our memes. 🤖❌</p>
                <p style="font-size:1rem;margin-top:20px;">Your secret meme pass (OTP) is:</p>
                <div style="background:#0f3460;border-radius:10px;padding:20px;text-align:center;margin:16px 0;">
                    <span style="font-size:2.8rem;font-weight:bold;letter-spacing:10px;color:#e94560;">${otp}</span>
                </div>
                <p style="color:#aaa;font-size:0.85rem;">⏰ This code expires in <strong>10 minutes</strong>. Faster than your attention span watching a 30-second video. 😅</p>
                <p style="color:#aaa;font-size:0.85rem;">🚨 If you didn't sign up — someone out there wants to steal your meme identity. Protect it!</p>
                <hr style="border-color:#333;margin:24px 0;">
                <p style="color:#666;font-size:0.8rem;text-align:center;">MemeHub — Because life's too short for bad memes 😂</p>
            </div>
        </div>`;

    try {
        await transporter.sendMail({
            from: `"MemeHub 🎭" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            html
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
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
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
        await sendOTP(email, otp, 'verify');
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
            { autoCommit: true }
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
            await sendOTP(email, otp, 'verify');
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
                   NVL(lk.like_count, 0) as like_count,
                   NVL(cm.comment_count, 0) as comment_count
            FROM Memes m
            JOIN Users u ON m.user_id = u.user_id
            LEFT JOIN Categories c ON m.category_id = c.category_id
            LEFT JOIN (SELECT meme_id, COUNT(*) as like_count FROM Likes GROUP BY meme_id) lk ON lk.meme_id = m.meme_id
            LEFT JOIN (SELECT meme_id, COUNT(*) as comment_count FROM Comments GROUP BY meme_id) cm ON cm.meme_id = m.meme_id
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
// Get public profile info
router.get('/users/:id/profile', async (req, res) => {
    let connection;
    const userId = req.params.id;
    try {
        const pool = getPool();
        connection = await pool.getConnection();
        const result = await connection.execute(
            `SELECT name, email, created_at,
                    (SELECT COUNT(*) FROM Memes WHERE user_id = :userId) as meme_count
             FROM Users WHERE user_id = :userId`,
            { userId }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [name, email, createdAt, memeCount] = result.rows[0];
        res.json({ userId, name, email, createdAt, memeCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

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

// ============ FORGOT / RESET PASSWORD ============

// Step 1: Request password reset OTP
router.post('/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    let connection;
    try {
        connection = await getPool().getConnection();
        const result = await connection.execute(
            `SELECT user_id FROM Users WHERE email = :email AND is_verified = 1`,
            { email }
        );
        // Always return success to prevent email enumeration
        if (result.rows.length === 0) {
            return res.json({ message: 'If that email exists, a reset OTP has been sent.' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000);
        await connection.execute(
            `INSERT INTO OTP_Logs (email, otp_code, expires_at, is_used) VALUES (:email, :otp, :expiresAt, 0)`,
            { email, otp, expiresAt },
            { autoCommit: true }
        );
        await sendOTP(email, otp, 'reset');
        res.json({ message: 'If that email exists, a reset OTP has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

// Step 2: Verify OTP + set new password
router.post('/auth/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    let connection;
    try {
        connection = await getPool().getConnection();
        const result = await connection.execute(
            `SELECT * FROM (SELECT otp_id, expires_at, is_used FROM OTP_Logs WHERE email = :email AND otp_code = :otp ORDER BY created_at DESC) WHERE ROWNUM <= 1`,
            { email, otp }
        );
        if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid OTP' });
        const [otpId, expiresAt, isUsed] = result.rows[0];
        if (isUsed === 1) return res.status(400).json({ error: 'OTP already used' });
        if (new Date() > expiresAt) return res.status(400).json({ error: 'OTP expired' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await connection.execute(
            `UPDATE OTP_Logs SET is_used = 1 WHERE otp_id = :otpId`,
            { otpId }, { autoCommit: true }
        );
        await connection.execute(
            `UPDATE Users SET password_hash = :hash WHERE email = :email`,
            { hash: hashedPassword, email }, { autoCommit: true }
        );
        res.json({ message: 'Password reset successfully! You can now log in.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

// ============ CHANGE PASSWORD (logged in) ============
router.put('/users/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    let connection;
    try {
        connection = await getPool().getConnection();
        const result = await connection.execute(
            `SELECT password_hash FROM Users WHERE user_id = :userId`,
            { userId: req.user.userId }
        );
        const hash = result.rows[0][0];
        const match = await bcrypt.compare(currentPassword, hash);
        if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

        const newHash = await bcrypt.hash(newPassword, 10);
        await connection.execute(
            `UPDATE Users SET password_hash = :hash WHERE user_id = :userId`,
            { hash: newHash, userId: req.user.userId }, { autoCommit: true }
        );
        await logActivity(req.user.userId, 'CHANGE_PASSWORD', 'User changed their password');
        res.json({ message: 'Password changed successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

// ============ GET SINGLE MEME ============
router.get('/memes/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await getPool().getConnection();
        const result = await connection.execute(
            `SELECT m.meme_id, m.title, m.image_url, m.description, m.created_at, m.updated_at,
                    u.name AS author, u.user_id, c.name AS category, c.category_id, m.meme_type,
                    NVL(lk.like_count, 0) AS like_count,
                    NVL(cm.comment_count, 0) AS comment_count
             FROM Memes m
             JOIN Users u ON m.user_id = u.user_id
             LEFT JOIN Categories c ON m.category_id = c.category_id
             LEFT JOIN (SELECT meme_id, COUNT(*) AS like_count FROM Likes GROUP BY meme_id) lk ON lk.meme_id = m.meme_id
             LEFT JOIN (SELECT meme_id, COUNT(*) AS comment_count FROM Comments GROUP BY meme_id) cm ON cm.meme_id = m.meme_id
             WHERE m.meme_id = :id`,
            { id }
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Meme not found' });
        const row = result.rows[0];
        res.json({
            id: row[0], title: row[1], imageUrl: row[2], description: row[3],
            createdAt: row[4], updatedAt: row[5], author: row[6], userId: row[7],
            category: row[8], categoryId: row[9], memeType: row[10] || 'image',
            likeCount: row[11] || 0, commentCount: row[12] || 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});
// ============ SYSTEM & ACTIVITY LOGS ============

router.get('/system-logs', (req, res) => {
    res.json(global.systemLogs || []);
});

router.get('/activity-logs', async (req, res) => {
    let connection;
    try {
        connection = await getPool().getConnection();
        const result = await connection.execute(
            `SELECT * FROM (
                SELECT a.log_id, a.user_id, a.action, a.details, a.log_timestamp as created_at, u.name 
                FROM Activity_Logs a
                JOIN Users u ON a.user_id = u.user_id
                ORDER BY a.log_timestamp DESC
             ) WHERE ROWNUM <= 50`
        );
        const logs = result.rows.map(row => ({
            id: row[0],
            userId: row[1],
            action: row[2],
            details: row[3],
            createdAt: row[4],
            userName: row[5]
        }));
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) await connection.close();
    }
});

export default router;
