# MINI PROJECT REPORT

---

## MEME COLLECTION SYSTEM (MemeHub)

---

**Technologies Used**

- Frontend → React.js (Vite), CSS
- Backend → Node.js (Express.js)
- Database → Oracle Database XE
- Server → Node.js (Port 5000) + Vite Dev Server (Port 5173)

**Architecture Flow**

```
User → React Form → Axios HTTP → Express.js API → Oracle Database → JSON Response → Browser
```

---

## 1. Title Page

**Project Title:** Meme Collection System (MemeHub)

**Description:** A full-stack web application that allows users to register, share, like, and comment on memes in image, video, or text format.

---

## 2. Bonafide Certificate

*This is to certify that this Mini Project titled "Meme Collection System (MemeHub)" is a bonafide work carried out as part of the Database Management Systems course.*

---

## 3. Declaration

*We hereby declare that this project is our original work and has not been submitted elsewhere for any academic purpose.*

---

## 4. Acknowledgment

*We would like to thank our faculty and institution for providing the opportunity and guidance to build this project.*

---

## 5. Abstract

The Meme Collection System (MemeHub) is a social media-style web application built using React.js on the frontend and Node.js/Express.js on the backend, with Oracle Database as the persistent data store. The system allows users to register with email OTP verification, log in securely using JWT tokens, upload memes (images, videos, or text), browse a feed, filter by category, search, like, and comment on memes. The project demonstrates practical implementation of database design, CRUD operations, joins, views, stored procedures, triggers, transactions, and full frontend-backend-database integration.

---

## 6. Table of Contents

1. Title Page
2. Bonafide Certificate
3. Declaration
4. Acknowledgment
5. Abstract
6. Table of Contents
7. Introduction
8. Literature Review
9. System Analysis
10. ER Diagram
11. Database Schema
12. SQL Implementation
13. Testing
14. Screenshots (Description)
15. Conclusion
16. Future Scope
17. References

---

## 7. Introduction

### System Purpose

MemeHub is a meme-sharing social platform where registered users can upload, browse, like, and comment on memes. It is similar to a mini Instagram, but focused entirely on meme content.

### User Roles

| Role | Description |
|---|---|
| Guest | Cannot access the system — must register/login |
| Registered User | Can upload memes, like, comment, edit profile |

### Required Functionalities

- User Registration with Email OTP Verification (funny MemeHub-branded HTML email)
- Secure Login with JWT Authentication
- Forgot Password via OTP email
- Change Password (while logged in)
- Upload Memes (Image / Video / Text format)
- Browse Meme Feed (Latest / Trending)
- Search Memes by title or description
- Filter Memes by Category
- Like / Unlike Memes
- Comment on Memes
- View Public User Profiles
- Edit Own Profile Name + Change Password + View Stats
- View Category Statistics

### Input and Output

| Input | Output |
|---|---|
| Registration form (name, email, password) | Funny MemeHub OTP email sent, user created |
| OTP code | JWT token, user logged in |
| Login credentials | JWT token |
| Forgot password email | Reset OTP email sent |
| Reset OTP + new password | Password updated |
| Current + new password (logged in) | Password changed |
| Meme upload form + file | Meme stored in DB + file saved to disk |
| Search term / category filter | Filtered meme list |
| Like button click | Like toggled in DB |
| Comment text | Comment saved in DB |

---

## 8. Literature Review

Modern social platforms like Reddit, Instagram, and 9GAG demonstrate the need for media-sharing systems with user authentication, content categorization, and social interaction features (likes, comments). This project implements a simplified version of such a system using:

- **JWT (JSON Web Tokens)** for stateless authentication — widely used in REST APIs
- **bcrypt** for password hashing — industry standard for secure credential storage
- **OTP-based email verification** — prevents fake account creation
- **Oracle Database** — enterprise-grade RDBMS with strong support for constraints, triggers, and stored procedures
- **React.js** — component-based UI library for building interactive single-page applications

---

## 9. System Analysis

### Phase 1: Requirement Analysis

**System Purpose:** Allow users to share and interact with meme content in a secure, categorized environment.

**Entities Identified:**
- Users (registered members)
- Memes (content posted by users)
- Categories (classification of memes)
- Likes (user interactions on memes)
- Comments (user responses on memes)
- OTP_Logs (email verification records)
- Activity_Logs (audit trail)

**Relationships:**
- A User can post many Memes (one-to-many)
- A Meme belongs to one Category (many-to-one)
- A User can Like many Memes; a Meme can be Liked by many Users (many-to-many)
- A User can Comment on many Memes; a Meme can have many Comments (one-to-many)
- OTP_Logs are linked to Users by email (one-to-many)
- Activity_Logs are linked to Users (one-to-many)

---

## 10. ER Diagram

```
+----------------+          +------------------+
|    Users       |          |    Categories    |
+----------------+          +------------------+
| user_id (PK)   |          | category_id (PK) |
| name           |          | name (UNIQUE)    |
| email (UNIQUE) |          | description      |
| password_hash  |          +------------------+
| is_verified    |                  |
| created_at     |                  | (1 category → many memes)
+----------------+                  |
       |                            |
       | (1 user → many memes)      |
       |                            ▼
       |                   +------------------+
       +------------------>|     Memes        |
       |                   +------------------+
       |                   | meme_id (PK)     |
       |                   | user_id (FK)     |
       |                   | category_id (FK) |
       |                   | title            |
       |                   | image_url        |
       |                   | description      |
       |                   | meme_type        |
       |                   | created_at       |
       |                   | updated_at       |
       |                   +------------------+
       |                          |
       |              +-----------+-----------+
       |              |                       |
       |              ▼                       ▼
       |       +-------------+       +--------------+
       |       |    Likes    |       |   Comments   |
       |       +-------------+       +--------------+
       +------>| like_id(PK) |       |comment_id(PK)|
       |       | user_id(FK) |       | user_id (FK) |
       |       | meme_id(FK) |       | meme_id (FK) |
       |       | created_at  |       | content      |
       |       | UNIQUE      |       | created_at   |
       |       |(user+meme)  |       +--------------+
       |       +-------------+
       |
       +-------> OTP_Logs (email FK → Users.email)
       |
       +-------> Activity_Logs (user_id FK → Users.user_id)
```

---

## 11. Database Schema

### Table: Users
```sql
CREATE TABLE Users (
    user_id   NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name      VARCHAR2(100) NOT NULL,
    email     VARCHAR2(100) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    is_verified   NUMBER(1) DEFAULT 0 CHECK (is_verified IN (0, 1)),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: Categories
```sql
CREATE TABLE Categories (
    category_id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name        VARCHAR2(100) UNIQUE NOT NULL,
    description VARCHAR2(255)
);
```

### Table: Memes
```sql
CREATE TABLE Memes (
    meme_id     NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id     NUMBER NOT NULL,
    category_id NUMBER,
    title       VARCHAR2(255) NOT NULL,
    image_url   VARCHAR2(1000),
    description CLOB,
    meme_type   VARCHAR2(10) DEFAULT 'image',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    CONSTRAINT fk_memes_user     FOREIGN KEY (user_id)     REFERENCES Users(user_id)       ON DELETE CASCADE,
    CONSTRAINT fk_memes_category FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);
```

### Table: OTP_Logs
```sql
CREATE TABLE OTP_Logs (
    otp_id     NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    email      VARCHAR2(100) NOT NULL,
    otp_code   VARCHAR2(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used    NUMBER(1) DEFAULT 0 CHECK (is_used IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_otp_email FOREIGN KEY (email) REFERENCES Users(email) ON DELETE CASCADE
);
```

### Table: Activity_Logs
```sql
CREATE TABLE Activity_Logs (
    log_id        NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id       NUMBER NOT NULL,
    action        VARCHAR2(100) NOT NULL,
    details       CLOB,
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
```

### Table: Likes
```sql
CREATE TABLE Likes (
    like_id    NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id    NUMBER NOT NULL,
    meme_id    NUMBER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_likes_meme FOREIGN KEY (meme_id) REFERENCES Memes(meme_id) ON DELETE CASCADE,
    CONSTRAINT uq_likes UNIQUE (user_id, meme_id)
);
```

### Table: Comments
```sql
CREATE TABLE Comments (
    comment_id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id    NUMBER NOT NULL,
    meme_id    NUMBER NOT NULL,
    content    CLOB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_meme FOREIGN KEY (meme_id) REFERENCES Memes(meme_id) ON DELETE CASCADE
);
```

### Sample Data
```sql
-- Oracle: each INSERT is a separate DML statement, COMMIT at the end
INSERT INTO Categories (name, description) VALUES ('Dank Memes',   'The dankest of the dank.');
INSERT INTO Categories (name, description) VALUES ('Wholesome',    'Memes that make you smile.');
INSERT INTO Categories (name, description) VALUES ('Programming',  'Relatable dev struggles.');
INSERT INTO Categories (name, description) VALUES ('Animals',      'Funny pets and wildlife.');
INSERT INTO Categories (name, description) VALUES ('Funny',        'Generally funny memes.');
INSERT INTO Categories (name, description) VALUES ('Gaming',       'Game-related memes.');
INSERT INTO Categories (name, description) VALUES ('Sports',       'Sports memes.');
COMMIT;

-- Sample Users (password_hash is bcrypt hash of 'password123')
INSERT INTO Users (name, email, password_hash, is_verified)
VALUES ('Alice Smith', 'alice@example.com', '$2a$10$examplehash1', 1);
INSERT INTO Users (name, email, password_hash, is_verified)
VALUES ('Bob Jones',  'bob@example.com',   '$2a$10$examplehash2', 1);
COMMIT;

-- Sample Memes
INSERT INTO Memes (user_id, category_id, title, image_url, description, meme_type)
VALUES (1, 3, 'When the code compiles first try', '/uploads/meme1.jpg', 'Impossible!', 'image');
INSERT INTO Memes (user_id, category_id, title, image_url, description, meme_type)
VALUES (2, 1, 'Monday morning vibes', '/uploads/meme2.jpg', 'Every week...', 'image');
COMMIT;
```

> **Oracle 11g Note:** If using Oracle 11g (which does not support `GENERATED BY DEFAULT AS IDENTITY`), use a SEQUENCE + BEFORE INSERT TRIGGER pattern instead. The `init_db.js` script in this project handles this automatically:
> ```sql
> CREATE SEQUENCE users_seq START WITH 1 INCREMENT BY 1;
> CREATE OR REPLACE TRIGGER users_bir
> BEFORE INSERT ON Users FOR EACH ROW
> BEGIN
>   SELECT users_seq.NEXTVAL INTO :NEW.user_id FROM dual;
> END;
> /
> ```

---

## 12. SQL Implementation

### Phase 3: CRUD Operations

#### CREATE — Register a new user
```sql
-- Oracle uses bind variables with RETURNING ... INTO for getting the generated ID
INSERT INTO Users (name, email, password_hash, is_verified)
VALUES ('John Doe', 'john@example.com', '$2a$10$hashedpassword', 0)
RETURNING user_id INTO :userId;
-- :userId will hold the auto-generated user_id after insert
COMMIT;
```

#### CREATE — Post a new meme
```sql
INSERT INTO Memes (user_id, category_id, title, image_url, description, meme_type)
VALUES (1, 3, 'When the code works', '/uploads/meme1.jpg', 'First try!', 'image');
COMMIT;
```

#### READ — Get all memes (with like and comment counts)
```sql
SELECT m.meme_id, m.title, m.image_url, m.description, m.created_at,
       u.name AS author, c.name AS category, m.meme_type, m.user_id,
       NVL(lk.like_count, 0)      AS like_count,
       NVL(cm.comment_count, 0)   AS comment_count
FROM Memes m
JOIN Users u ON m.user_id = u.user_id
LEFT JOIN Categories c ON m.category_id = c.category_id
LEFT JOIN (SELECT meme_id, COUNT(*) AS like_count    FROM Likes    GROUP BY meme_id) lk ON lk.meme_id = m.meme_id
LEFT JOIN (SELECT meme_id, COUNT(*) AS comment_count FROM Comments GROUP BY meme_id) cm ON cm.meme_id = m.meme_id
WHERE 1=1
ORDER BY m.created_at DESC;
```

#### UPDATE — Edit a meme
```sql
UPDATE Memes
SET title       = 'Updated Title',
    description = 'Updated description',
    category_id = 2,
    updated_at  = SYSTIMESTAMP   -- Oracle native: returns current date+time with timezone
WHERE meme_id = 1;
COMMIT;
```

#### DELETE — Delete a meme (cascades to Likes and Comments)
```sql
DELETE FROM Memes WHERE meme_id = 1;
COMMIT;
-- Oracle FK with ON DELETE CASCADE automatically removes
-- related rows in Likes and Comments tables
```

#### READ — Get a single meme by ID
```sql
SELECT m.meme_id, m.title, m.image_url, m.description, m.created_at, m.updated_at,
       u.name AS author, u.user_id, c.name AS category, c.category_id, m.meme_type,
       NVL(lk.like_count, 0) AS like_count,
       NVL(cm.comment_count, 0) AS comment_count
FROM Memes m
JOIN Users u ON m.user_id = u.user_id
LEFT JOIN Categories c ON m.category_id = c.category_id
LEFT JOIN (SELECT meme_id, COUNT(*) AS like_count FROM Likes GROUP BY meme_id) lk ON lk.meme_id = m.meme_id
LEFT JOIN (SELECT meme_id, COUNT(*) AS comment_count FROM Comments GROUP BY meme_id) cm ON cm.meme_id = m.meme_id
WHERE m.meme_id = :id;
```

#### CREATE — Request password reset OTP
```sql
-- Check email exists and is verified
SELECT user_id FROM Users WHERE email = :email AND is_verified = 1;

-- Insert reset OTP
INSERT INTO OTP_Logs (email, otp_code, expires_at, is_used)
VALUES (:email, :otp, :expiresAt, 0);
COMMIT;
-- Then sends funny MemeHub-branded HTML reset email via Nodemailer
```

#### UPDATE — Reset password with OTP
```sql
-- Find latest matching OTP
SELECT otp_id, expires_at, is_used
FROM (SELECT otp_id, expires_at, is_used FROM OTP_Logs
      WHERE email = :email AND otp_code = :otp ORDER BY created_at DESC)
WHERE ROWNUM <= 1;

-- Mark OTP used
UPDATE OTP_Logs SET is_used = 1 WHERE otp_id = :otpId;

-- Update password hash
UPDATE Users SET password_hash = :newHash WHERE email = :email;
COMMIT;
```

#### UPDATE — Change password (while logged in)
```sql
-- Verify current password first (bcrypt.compare in JS)
SELECT password_hash FROM Users WHERE user_id = :userId;

-- Update with new hash
UPDATE Users SET password_hash = :newHash WHERE user_id = :userId;
COMMIT;

INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'CHANGE_PASSWORD', 'User changed their password');
```

---

### Phase 4: Query Implementation

#### SELECT with WHERE — Search memes by keyword
```sql
SELECT meme_id, title, description
FROM Memes
WHERE LOWER(title) LIKE '%cat%'
   OR LOWER(description) LIKE '%cat%';
```

#### SELECT with ORDER BY — Latest memes first
```sql
SELECT meme_id, title, created_at
FROM Memes
ORDER BY created_at DESC;

-- Oracle: To get only the top 5 latest memes, use ROWNUM or FETCH FIRST (Oracle 12c+):
-- Oracle 12c+ syntax:
SELECT meme_id, title, created_at
FROM Memes
ORDER BY created_at DESC
FETCH FIRST 5 ROWS ONLY;

-- Oracle 11g syntax (using ROWNUM in subquery):
SELECT * FROM (
    SELECT meme_id, title, created_at
    FROM Memes
    ORDER BY created_at DESC
) WHERE ROWNUM <= 5;
```

#### SELECT with GROUP BY — Count memes per category
```sql
-- Oracle requires every non-aggregated column in SELECT to appear in GROUP BY
SELECT c.name AS category, COUNT(m.meme_id) AS meme_count
FROM Categories c
LEFT JOIN Memes m ON c.category_id = m.category_id
GROUP BY c.name
ORDER BY COUNT(m.meme_id) DESC;
-- Note: Oracle does not allow ORDER BY alias in some contexts,
-- so we repeat the aggregate expression or use a subquery:
SELECT category, meme_count FROM (
    SELECT c.name AS category, COUNT(m.meme_id) AS meme_count
    FROM Categories c
    LEFT JOIN Memes m ON c.category_id = m.category_id
    GROUP BY c.name
) ORDER BY meme_count DESC;
```

#### JOIN — Get memes with author name and category name
```sql
SELECT m.title, u.name AS author, c.name AS category
FROM Memes m
JOIN Users u ON m.user_id = u.user_id
LEFT JOIN Categories c ON m.category_id = c.category_id;
```

#### SUBQUERY — Get user profile with meme count
```sql
SELECT name, email, created_at,
       (SELECT COUNT(*) FROM Memes WHERE user_id = u.user_id) AS meme_count
FROM Users u
WHERE user_id = 1;
```

#### SUBQUERY — Get most recent OTP for a user
```sql
SELECT otp_id, expires_at, is_used
FROM (
    SELECT otp_id, expires_at, is_used
    FROM OTP_Logs
    WHERE email = 'john@example.com' AND otp_code = '847291'
    ORDER BY created_at DESC
)
WHERE ROWNUM <= 1;
```

#### VIEW — Trending memes (most liked)
```sql
-- Note: Oracle does not allow ORDER BY inside a CREATE VIEW.
-- Ordering is applied when querying the view.
CREATE OR REPLACE VIEW vw_trending_memes AS
SELECT m.meme_id, m.title, u.name AS author,
       COUNT(l.like_id) AS like_count
FROM Memes m
JOIN Users u ON m.user_id = u.user_id
LEFT JOIN Likes l ON l.meme_id = m.meme_id
GROUP BY m.meme_id, m.title, u.name;

-- Query the view with ordering:
SELECT * FROM vw_trending_memes
ORDER BY like_count DESC;
```

#### VIEW — Active users (users who posted at least one meme)
```sql
CREATE OR REPLACE VIEW vw_active_users AS
SELECT u.user_id, u.name, u.email, COUNT(m.meme_id) AS total_memes
FROM Users u
LEFT JOIN Memes m ON m.user_id = u.user_id
GROUP BY u.user_id, u.name, u.email
HAVING COUNT(m.meme_id) > 0;

-- Query the view:
SELECT * FROM vw_active_users ORDER BY total_memes DESC;
```

---

### Phase 5: Advanced Concepts

#### Stored Procedure — Get all memes by a specific user
```sql
CREATE OR REPLACE PROCEDURE get_user_memes(p_user_id IN NUMBER) AS
BEGIN
    FOR rec IN (
        SELECT m.meme_id, m.title, m.meme_type, m.created_at
        FROM Memes m
        WHERE m.user_id = p_user_id
        ORDER BY m.created_at DESC
    ) LOOP
        DBMS_OUTPUT.PUT_LINE(
            'ID: ' || rec.meme_id ||
            ' | Title: ' || rec.title ||
            ' | Type: ' || rec.meme_type
        );
    END LOOP;
END;
/

-- Execute:
EXEC get_user_memes(1);
```

#### Stored Procedure — Delete expired OTPs (cleanup)
```sql
CREATE OR REPLACE PROCEDURE cleanup_expired_otps AS
BEGIN
    DELETE FROM OTP_Logs
    WHERE expires_at < CURRENT_TIMESTAMP
      AND is_used = 0;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Expired OTPs cleaned up. Rows deleted: ' || SQL%ROWCOUNT);
END;
/

-- Execute:
EXEC cleanup_expired_otps;
```

#### Trigger — Auto-log activity when a new meme is inserted
```sql
CREATE OR REPLACE TRIGGER trg_meme_insert_log
AFTER INSERT ON Memes
FOR EACH ROW
BEGIN
    INSERT INTO Activity_Logs (user_id, action, details)
    VALUES (
        :NEW.user_id,
        'AUTO_MEME_CREATED',
        'Trigger: Meme inserted with ID ' || :NEW.meme_id || ', title: ' || :NEW.title
    );
END;
/
```

#### Trigger — Prevent liking your own meme
```sql
CREATE OR REPLACE TRIGGER trg_prevent_self_like
BEFORE INSERT ON Likes
FOR EACH ROW
DECLARE
    v_owner NUMBER;
BEGIN
    SELECT user_id INTO v_owner
    FROM Memes
    WHERE meme_id = :NEW.meme_id;

    IF v_owner = :NEW.user_id THEN
        RAISE_APPLICATION_ERROR(-20001, 'You cannot like your own meme.');
    END IF;
END;
/
```

#### Transaction — OTP Verification (Atomic: mark OTP used + verify user together)
```sql
-- Both updates must succeed or both must roll back (ACID)
BEGIN
    UPDATE OTP_Logs
    SET is_used = 1
    WHERE otp_id = 42;

    UPDATE Users
    SET is_verified = 1
    WHERE email = 'john@example.com';

    COMMIT;  -- Only commits if both succeed
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;  -- Rolls back both if anything fails
        RAISE;
END;
/
```

#### Indexing — Speed up common queries
```sql
-- Index on Memes.user_id (used in every user profile query)
CREATE INDEX idx_memes_user_id ON Memes(user_id);

-- Index on Memes.category_id (used in category filter)
CREATE INDEX idx_memes_category_id ON Memes(category_id);

-- Index on Likes(meme_id) (used in like count aggregation)
CREATE INDEX idx_likes_meme_id ON Likes(meme_id);

-- Index on Comments(meme_id) (used in comment count aggregation)
CREATE INDEX idx_comments_meme_id ON Comments(meme_id);

-- Index on OTP_Logs(email) (used in OTP lookup)
CREATE INDEX idx_otp_email ON OTP_Logs(email);
```

---

### Phase 6: Frontend Integration

#### Architecture Flow
```
User → React Form → Axios HTTP Request → Express.js Route → Oracle DB → JSON Response → React State → UI Update
```

#### Frontend Design (React — Register Form)
```jsx
// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function Register({ onLogin }) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp]         = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:5000/api/auth/register',
      { name, email, password }
    );
    setShowOtp(true); // Show OTP input after registration
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const res = await axios.post('http://localhost:5000/api/auth/verify',
      { email, otp }
    );
    onLogin(res.data.user, res.data.token); // Store token, redirect to dashboard
  };

  return (
    <form onSubmit={!showOtp ? handleRegister : handleVerifyOtp}>
      {!showOtp ? (
        <>
          <input type="text"     placeholder="Full Name"  onChange={e => setName(e.target.value)}     required />
          <input type="email"    placeholder="Email"      onChange={e => setEmail(e.target.value)}    required />
          <input type="password" placeholder="Password"   onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Create Account</button>
        </>
      ) : (
        <>
          <input type="text" placeholder="Enter OTP" onChange={e => setOtp(e.target.value)} required />
          <button type="submit">Verify OTP & Login</button>
        </>
      )}
    </form>
  );
}
```

#### Database Connectivity (Node.js + OracleDB)
```js
// db.js
import oracledb from 'oracledb';
import dotenv from 'dotenv';
dotenv.config();

let pool;

export async function initializeDatabase() {
    pool = await oracledb.createPool({
        user:          process.env.DB_USER,
        password:      process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECTION_STRING,
        poolMin: 2,
        poolMax: 10,
        poolIncrement: 1
    });
    console.log('Oracle Database Pool Created Successfully');
}

export function getPool() {
    return pool;
}
```

#### Backend — Insert Meme (Node.js/Express)
```js
// routes.js — POST /api/memes
router.post('/memes', authenticateToken, upload.single('file'), async (req, res) => {
    const { title, description, categoryId, memeType } = req.body;
    let fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const connection = await getPool().getConnection();
    await connection.execute(
        `INSERT INTO Memes (user_id, category_id, title, image_url, description, meme_type)
         VALUES (:userId, :categoryId, :title, :imageUrl, :description, :memeType)`,
        { userId: req.user.userId, categoryId, title,
          imageUrl: fileUrl, description, memeType },
        { autoCommit: true }
    );
    await connection.close();
    res.status(201).json({ message: 'Meme created successfully' });
});
```

#### Backend — Display Memes (Node.js/Express)
```js
// routes.js — GET /api/memes
router.get('/memes', async (req, res) => {
    const { q, sort, categoryId } = req.query;
    const connection = await getPool().getConnection();

    let sql = `
        SELECT m.meme_id, m.title, m.image_url, m.description,
               u.name AS author, c.name AS category,
               NVL(lk.like_count, 0) AS like_count
        FROM Memes m
        JOIN Users u ON m.user_id = u.user_id
        LEFT JOIN Categories c ON m.category_id = c.category_id
        LEFT JOIN (SELECT meme_id, COUNT(*) AS like_count FROM Likes GROUP BY meme_id) lk
               ON lk.meme_id = m.meme_id
        WHERE 1=1
    `;
    const binds = {};
    if (q) { sql += ` AND LOWER(m.title) LIKE :q`; binds.q = `%${q.toLowerCase()}%`; }
    sql += sort === 'trending' ? ` ORDER BY like_count DESC` : ` ORDER BY m.created_at DESC`;

    const result = await connection.execute(sql, binds);
    await connection.close();
    res.json(result.rows.map(row => ({
        id: row[0], title: row[1], imageUrl: row[2],
        description: row[3], author: row[4], category: row[5], likeCount: row[6]
    })));
});
```

---

## 13. Testing

| Test Case | Input | Expected Output | Result |
|---|---|---|---|
| Register with valid data | name, email, password | Funny MemeHub OTP email sent, user created | PASS |
| Register with duplicate email | existing email | "Email already exists" error | PASS |
| Register with short password | password < 6 chars | "Password must be at least 6 characters" | PASS |
| OTP verification with valid OTP | correct 6-digit code | JWT token returned, user verified | PASS |
| OTP verification with expired OTP | OTP older than 10 min | "OTP expired" error | PASS |
| Login with correct credentials | email + password | JWT token returned | PASS |
| Login with wrong password | wrong password | "Invalid credentials" error | PASS |
| Login with unverified account | unverified user | New OTP sent, 403 response | PASS |
| Forgot password with valid email | registered email | Reset OTP email sent | PASS |
| Forgot password with unknown email | unregistered email | Same success message (no enumeration) | PASS |
| Reset password with valid OTP | correct OTP + new password | Password updated, login works | PASS |
| Reset password with expired OTP | expired OTP | "OTP expired" error | PASS |
| Change password (logged in) correct | current + new password | Password updated | PASS |
| Change password wrong current | wrong current password | "Current password is incorrect" | PASS |
| Upload image meme | title + image file | Meme saved, file stored in /uploads | PASS |
| Upload text meme | title + text content | Meme saved with null image_url | PASS |
| Get single meme by ID | meme_id | Full meme object with categoryId | PASS |
| Edit own meme (inline) | new title + description | PUT /api/memes/:id called, card updates in-place | PASS |
| Edit another user's meme | non-owner tries PUT | "Forbidden" 403 error | PASS |
| Edit/Delete buttons visibility | own meme vs others | Buttons only show on own memes | PASS |
| Delete own meme | meme owner clicks trash | Confirm dialog → DELETE → removed from feed | PASS |
| Delete another user's meme | non-owner tries DELETE | "Forbidden" 403 error | PASS |
| Like a meme | authenticated user | like_count incremented | PASS |
| Unlike a meme (toggle) | already liked meme | like_count decremented | PASS |
| Post a comment | comment text | Comment saved, appears in list | PASS |
| Search memes | keyword "cat" | Only matching memes returned | PASS |
| Filter by category | categoryId=3 | Only memes in that category | PASS |
| Sort by trending | sort=trending | Memes ordered by like count | PASS |
| View user profile | userId=1 | Profile info + meme count returned | PASS |
| Update profile name | new name | Name updated in DB and navbar | PASS |
| Profile stats display | load profile page | Shows meme count + join date | PASS |

---

## 14. Screenshots (Description)

1. **Login Page** — Clean card with email/password fields, "Forgot password?" link, and Register link
2. **OTP Verification Screen** — Appears after registration or unverified login; 6-digit input field
3. **Forgot Password Page** — 3-step flow: enter email → receive OTP → set new password
4. **Dashboard / Meme Feed** — Grid of meme cards with search bar, sort tabs (Latest/Trending), and category filter chips
5. **Upload Meme Modal** — Type selector (Image/Video/Text), file upload area, category dropdown, description textarea
6. **MemeCard (viewer)** — Shows meme media, author link, like count, comment count
7. **MemeCard (owner)** — Same as above plus pencil (edit) and trash (delete) buttons in the action row
8. **MemeCard inline edit** — Clicking edit replaces title/description with input fields + category dropdown + Save/Cancel buttons, all inside the card
9. **Comments Section** — Expandable below each meme card; shows all comments with author names and a post form
10. **Stats Modal** — List showing meme count per category
11. **User Profile Page** — Public profile with avatar, join date, meme count, and their meme grid
12. **Profile Page** — Top card: avatar, name, email, meme count + join date stats. Below: Edit Profile card + Change Password card
13. **MemeHub OTP Email** — Dark-themed HTML email with 🎭 branding, large OTP code, and funny meme jokes

---

## 15. Conclusion

The Meme Collection System (MemeHub) successfully demonstrates all required database concepts:

- **Database Design** — 7 normalized tables with proper ER modeling
- **Constraints** — PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, CHECK used across all tables
- **CRUD Operations** — Full create, read, update, delete for users, memes, likes, comments, and passwords
- **Inline Edit/Delete** — Meme owners can edit or delete their posts directly from the feed card
- **Queries** — SELECT, WHERE, GROUP BY, ORDER BY, JOINs, and subqueries all implemented
- **Views** — `vw_trending_memes` and `vw_active_users` created
- **Stored Procedures** — `get_user_memes` and `cleanup_expired_otps`
- **Triggers** — Auto-activity logging on meme insert; self-like prevention
- **Transactions** — OTP verification uses atomic commit/rollback
- **Indexing** — Indexes on foreign keys and frequently queried columns
- **Frontend Integration** — React.js frontend connected to Express.js backend connected to Oracle DB
- **Forgot Password** — Full OTP-based password reset flow
- **Change Password** — Secure in-app password change with current password verification
- **Funny OTP Emails** — HTML-branded MemeHub emails with jokes and dark theme styling
- **Improved Profile** — Avatar, stats (meme count + join date), edit name, change password in one clean page

---

## 16. Future Scope

- **Password Reset** — Forgot password flow via email OTP
- **Meme Editing with File Replace** — Allow updating the image/video file of an existing meme
- **Notifications** — Real-time alerts when someone likes or comments on your meme
- **Follow System** — Follow other users and see a personalized feed
- **Meme Tags** — Free-form tags in addition to categories
- **Admin Dashboard** — Role-based access for moderators to delete inappropriate content
- **Pagination** — Infinite scroll or page-based loading for large meme feeds
- **Cloud Storage** — Move file uploads from local disk to AWS S3 or similar
- **Mobile App** — React Native version of the frontend

---

## 17. References

1. Oracle Database Documentation — https://docs.oracle.com/en/database/
2. Express.js Official Docs — https://expressjs.com/
3. React.js Official Docs — https://react.dev/
4. node-oracledb GitHub — https://github.com/oracle/node-oracledb
5. JSON Web Tokens (JWT) — https://jwt.io/introduction
6. bcryptjs npm package — https://www.npmjs.com/package/bcryptjs
7. Multer (file uploads) — https://github.com/expressjs/multer
8. Nodemailer Docs — https://nodemailer.com/about/
9. Vite.js Docs — https://vitejs.dev/

---

## Folder Structure

```
MemeHub/
├── server.js              ← Express server entry point
├── routes.js              ← All API route handlers
├── db.js                  ← Oracle DB connection pool
├── db_setup.sql           ← SQL to create all tables
├── init_db.js             ← JS script to initialize DB
├── package.json           ← Backend dependencies
├── .env                   ← Environment variables (secrets)
├── .env.example           ← Template for .env
├── uploads/               ← Uploaded image/video files stored here
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json       ← Frontend dependencies
    └── src/
        ├── main.jsx           ← React entry point
        ├── App.jsx            ← Root component + routing + auth state
        ├── index.css          ← Global styles
        ├── components/
        │   ├── Navbar.jsx     ← Top navigation bar
        │   └── MemeCard.jsx   ← Meme display card (likes, comments)
        └── pages/
            ├── Login.jsx          ← Login + OTP + Forgot Password link
            ├── Register.jsx       ← Registration + OTP verification
            ├── ForgotPassword.jsx ← Forgot password 3-step flow
            ├── Dashboard.jsx      ← Main meme feed
            ├── Profile.jsx        ← Stats + edit name + change password
            └── UserProfile.jsx    ← View any user's public profile
```

---

*Mini Project Report — Meme Collection System (MemeHub)*
*Database Management Systems — April 2026*
