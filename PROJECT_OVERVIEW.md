# MemeHub — Complete Project Overview

> A full-stack web application where users can register, share, like, and comment on memes (images, videos, or text).

---

## Table of Contents

1. [What is this project?](#1-what-is-this-project)
2. [Tech Stack (What tools are used)](#2-tech-stack)
3. [Project Folder Structure](#3-project-folder-structure)
4. [Database — Tables & Relationships](#4-database)
5. [How the Backend Works](#5-backend)
6. [Every API Endpoint — What it does & which SQL runs](#6-api-endpoints)
7. [How the Frontend Works](#7-frontend)
8. [Complete Data Flow Diagrams](#8-data-flow-diagrams)
9. [Authentication Flow (Register → OTP → Login)](#9-authentication-flow)
10. [Environment Variables](#10-environment-variables)
11. [How to Run the Project](#11-how-to-run)

---

## 1. What is this project?

MemeHub is a social meme-sharing platform. Think of it like a mini Instagram, but only for memes.

**What users can do:**
- Create an account (with email verification via funny MemeHub-branded OTP email)
- Log in securely
- Forgot password — reset via OTP email
- Change password from profile (while logged in)
- Browse a feed of memes posted by everyone
- Search memes by title or description
- Filter memes by category (Dank, Wholesome, Programming, etc.)
- Sort by Latest or Trending (most liked)
- Upload memes — as an image file, video file, or plain text
- Like / unlike any meme
- Comment on memes
- View any user's public profile and their meme collection
- Edit their own profile name and change password
- View their own stats (meme count, join date)

---

## 2. Tech Stack

| Layer | Technology | What it does |
|---|---|---|
| Frontend | React 19 + Vite | The website the user sees in the browser |
| Routing | React Router DOM v7 | Handles page navigation (/, /login, /profile, etc.) |
| HTTP Client | Axios | Sends requests from browser to backend |
| Icons | Lucide React | All the icons in the UI |
| Backend | Node.js + Express | The server that handles all API requests |
| Database | Oracle DB (via OracleDB npm) | Stores all data permanently |
| Auth | JWT (JSON Web Tokens) | Keeps users logged in securely |
| Password | bcryptjs | Hashes passwords so they're never stored as plain text |
| Email | Nodemailer + Gmail | Sends OTP emails for account verification |
| File Upload | Multer | Handles image/video file uploads |
| Dev Server | Nodemon | Auto-restarts backend on code changes |

---

## 3. Project Folder Structure

```
project-root/
│
├── server.js          ← Entry point. Starts the Express server
├── routes.js          ← All API route handlers (the brain of the backend)
├── db.js              ← Oracle DB connection pool setup
├── db_setup.sql       ← SQL to create all tables (run once manually)
├── init_db.js         ← Alternative JS script to create tables programmatically
├── package.json       ← Backend dependencies
├── .env               ← Secret config (DB password, JWT secret, email creds)
├── .env.example       ← Template showing what .env needs
│
├── uploads/           ← Where uploaded image/video files are saved on disk
│
└── frontend/          ← The React app
    ├── index.html
    ├── vite.config.js
    ├── package.json   ← Frontend dependencies
    └── src/
        ├── main.jsx           ← React app entry point
        ├── App.jsx            ← Root component, routing, auth state
        ├── index.css          ← Global styles
        ├── components/
        │   ├── Navbar.jsx     ← Top navigation bar
        │   └── MemeCard.jsx   ← Single meme display card (likes, comments)
        └── pages/
            ├── Login.jsx          ← Login page + OTP verification + Forgot Password link
            ├── Register.jsx       ← Registration page + OTP verification
            ├── ForgotPassword.jsx ← Forgot password (email → OTP → new password)
            ├── Dashboard.jsx      ← Main feed page (search, filter, upload)
            ├── Profile.jsx        ← Edit profile name + change password + stats
            └── UserProfile.jsx    ← View another user's public profile
```

---

## 4. Database

The database is Oracle. There are **6 tables** total.

### Table Relationships (Entity Diagram)

```
Categories
    │
    │ (one category → many memes)
    ▼
Users ──────────────────────────────────────────────────────┐
    │                                                        │
    │ (one user → many memes)                               │
    ▼                                                        │
Memes ◄──────────────────────────────────────────────────── │
    │         ▲                                              │
    │         │ (one meme → many likes, many comments)       │
    ├──► Likes (user_id + meme_id, unique pair)              │
    └──► Comments (user_id + meme_id + content)              │
                                                             │
OTP_Logs (email → linked to Users.email)  ◄─────────────────┘
Activity_Logs (user_id → linked to Users.user_id)
```

### Table Details

**Users** — stores every registered person
| Column | Type | Notes |
|---|---|---|
| user_id | NUMBER (PK) | Auto-generated ID |
| name | VARCHAR2(100) | Display name |
| email | VARCHAR2(100) | Unique, used for login |
| password_hash | VARCHAR2(255) | bcrypt hashed password |
| is_verified | NUMBER(1) | 0 = not verified, 1 = verified |
| created_at | TIMESTAMP | When they registered |

**Categories** — meme categories (pre-seeded)
| Column | Type | Notes |
|---|---|---|
| category_id | NUMBER (PK) | Auto-generated |
| name | VARCHAR2(100) | e.g. "Dank Memes", "Gaming" |
| description | VARCHAR2(255) | Short description |

**Memes** — every meme posted
| Column | Type | Notes |
|---|---|---|
| meme_id | NUMBER (PK) | Auto-generated |
| user_id | NUMBER (FK) | Who posted it |
| category_id | NUMBER (FK) | Which category (nullable) |
| title | VARCHAR2(255) | Meme title |
| image_url | VARCHAR2(1000) | File path or null for text memes |
| description | CLOB | Description or text content |
| meme_type | VARCHAR2(10) | 'image', 'video', or 'text' |
| created_at | TIMESTAMP | When posted |
| updated_at | TIMESTAMP | When last edited |

**OTP_Logs** — one-time passwords for email verification
| Column | Type | Notes |
|---|---|---|
| otp_id | NUMBER (PK) | Auto-generated |
| email | VARCHAR2(100) | Which email this OTP is for |
| otp_code | VARCHAR2(10) | The 6-digit code |
| expires_at | TIMESTAMP | Valid for 10 minutes |
| is_used | NUMBER(1) | 0 = unused, 1 = already used |
| created_at | TIMESTAMP | When generated |

**Likes** — tracks who liked what
| Column | Type | Notes |
|---|---|---|
| like_id | NUMBER (PK) | Auto-generated |
| user_id | NUMBER (FK) | Who liked |
| meme_id | NUMBER (FK) | What was liked |
| created_at | TIMESTAMP | When liked |
| UNIQUE | (user_id, meme_id) | Can't like the same meme twice |

**Comments** — comments on memes
| Column | Type | Notes |
|---|---|---|
| comment_id | NUMBER (PK) | Auto-generated |
| user_id | NUMBER (FK) | Who commented |
| meme_id | NUMBER (FK) | Which meme |
| content | CLOB | The comment text |
| created_at | TIMESTAMP | When posted |

**Activity_Logs** — audit trail of user actions
| Column | Type | Notes |
|---|---|---|
| log_id | NUMBER (PK) | Auto-generated |
| user_id | NUMBER (FK) | Who did the action |
| action | VARCHAR2(100) | e.g. 'LOGIN', 'CREATE_MEME' |
| details | CLOB | Extra info |
| log_timestamp | TIMESTAMP | When it happened |

---

## 5. Backend

### How the server starts (`server.js`)

```
node server.js
    │
    ├── loads .env (PORT, DB creds, JWT secret, email creds)
    ├── creates Express app
    ├── enables CORS (so the React frontend can talk to it)
    ├── enables JSON body parsing
    ├── serves /uploads folder as static files (so images are accessible via URL)
    ├── mounts all routes under /api
    └── calls initializeDatabase() → creates Oracle connection pool → starts listening on PORT 5000
```

### Database Connection (`db.js`)

Instead of opening a new database connection for every request (slow), the app creates a **connection pool** at startup. A pool is like a group of pre-opened connections that are reused.

- Pool minimum: 2 connections always open
- Pool maximum: 10 connections at peak load
- Every route handler calls `getPool().getConnection()` to borrow one, uses it, then calls `connection.close()` to return it

### File Uploads (`multer` in `routes.js`)

When a user uploads an image or video:
1. Multer intercepts the `multipart/form-data` request
2. Saves the file to the `uploads/` folder on disk
3. Generates a unique filename: `timestamp-randomnumber.ext`
4. The file path (`/uploads/filename.jpg`) is stored in the `Memes.image_url` column
5. The frontend fetches the file via `http://localhost:5000/uploads/filename.jpg`

Max file size: **50MB**. Allowed types: jpeg, jpg, png, gif, webp, mp4, webm, mov.

### JWT Authentication

After login or OTP verification, the server creates a **JWT token** containing:
```json
{ "userId": 1, "email": "user@example.com", "name": "John" }
```
This token is signed with `JWT_SECRET` and expires in **24 hours**.

The frontend stores this token in `localStorage`. For every protected request, it sends:
```
Authorization: Bearer <token>
```
The `authenticateToken` middleware on the backend verifies this token before allowing access.

### Funny OTP Email

All OTP emails are HTML-formatted with MemeHub branding. There are two types:

- **Verification email** (on register) — dark themed card with jokes like *"we need to make sure you're a real human and not a bot trying to steal our memes 🤖❌"* and *"expires faster than your attention span watching a 30-second video 😅"*
- **Password reset email** — same branding with *"Don't let it die like your motivation on Mondays"*

Both are sent from `"MemeHub 🎭" <your@gmail.com>` with a styled HTML template.

---

## 6. API Endpoints

Base URL: `http://localhost:5000/api`

All protected routes require the header: `Authorization: Bearer <jwt_token>`

---

### AUTH

#### POST `/api/auth/register`
**What it does:** Creates a new user account and sends a verification OTP email.

**Request body:**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }
```

**SQL queries that run:**
```sql
-- 1. Hash the password with bcrypt (done in JS, not SQL)

-- 2. Insert the new user
INSERT INTO Users (name, email, password_hash, is_verified)
VALUES (:name, :email, :hashedPassword, 0)
RETURNING user_id INTO :userId

-- 3. Generate a 6-digit OTP and insert it
INSERT INTO OTP_Logs (email, otp_code, expires_at, is_used)
VALUES (:email, :otp, :expiresAt, 0)

-- 4. Log the activity
INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'REGISTER', 'User registered, OTP sent')
```

**Then:** Sends an email via Gmail with the OTP code.

**Response:** `201 { message: "User registered. Please check email for OTP." }`

**Error cases:**
- `400` — Email already exists (Oracle error ORA-00001 = unique constraint)
- `400` — Missing fields or password too short

---

#### POST `/api/auth/verify`
**What it does:** Verifies the OTP code, marks the user as verified, and returns a JWT token.

**Request body:**
```json
{ "email": "john@example.com", "otp": "123456" }
```

**SQL queries that run:**
```sql
-- 1. Find the most recent OTP for this email+code combo
SELECT otp_id, expires_at, is_used
FROM (
  SELECT otp_id, expires_at, is_used
  FROM OTP_Logs
  WHERE email = :email AND otp_code = :otp
  ORDER BY created_at DESC
)
WHERE ROWNUM <= 1

-- 2. Mark OTP as used
UPDATE OTP_Logs SET is_used = 1 WHERE otp_id = :otpId

-- 3. Mark user as verified
UPDATE Users SET is_verified = 1 WHERE email = :email

-- 4. Fetch user info to build the JWT
SELECT user_id, name FROM Users WHERE email = :email

-- 5. Log the activity
INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'VERIFY_OTP', 'User successfully verified email')
```

**Response:** `200 { token, user: { userId, name, email } }`

**Error cases:**
- `400` — OTP not found / already used / expired

---

#### POST `/api/auth/login`
**What it does:** Checks credentials and returns a JWT token. If account is unverified, sends a new OTP.

**Request body:**
```json
{ "email": "john@example.com", "password": "secret123" }
```

**SQL queries that run:**
```sql
-- 1. Fetch user by email
SELECT user_id, name, password_hash, is_verified
FROM Users WHERE email = :email

-- 2. (If unverified) Insert new OTP
INSERT INTO OTP_Logs (email, otp_code, expires_at, is_used)
VALUES (:email, :otp, :expiresAt, 0)

-- 3. Log the activity
INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'LOGIN', 'User logged in')
```

**Then:** bcrypt compares the submitted password against the stored hash.

**Response:** `200 { token, user: { userId, name, email } }`

**Error cases:**
- `401` — Email not found or wrong password
- `403` — Account not verified (new OTP sent)

---

### CATEGORIES

#### GET `/api/categories`
**What it does:** Returns all meme categories. Used to populate the filter bar and upload form dropdown.

**No auth required.**

**SQL query:**
```sql
SELECT category_id, name, description
FROM Categories
ORDER BY name ASC
```

**Response:** `[{ id, name, description }, ...]`

---

### MEMES

#### GET `/api/memes`
**What it does:** Returns all memes. Supports search, category filter, user filter, and sort order.

**No auth required.**

**Query parameters:**
| Param | Type | Example | Effect |
|---|---|---|---|
| q | string | `?q=cat` | Search title and description |
| sort | string | `?sort=trending` | Sort by likes desc (default: latest) |
| categoryId | number | `?categoryId=3` | Filter by category |
| userId | number | `?userId=5` | Only show memes from one user |

**SQL query (simplified):**
```sql
SELECT m.meme_id, m.title, m.image_url, m.description, m.created_at,
       u.name as author, c.name as category, m.meme_type, m.user_id,
       NVL(lk.like_count, 0) as like_count,
       NVL(cm.comment_count, 0) as comment_count
FROM Memes m
JOIN Users u ON m.user_id = u.user_id
LEFT JOIN Categories c ON m.category_id = c.category_id
LEFT JOIN (SELECT meme_id, COUNT(*) as like_count FROM Likes GROUP BY meme_id) lk
       ON lk.meme_id = m.meme_id
LEFT JOIN (SELECT meme_id, COUNT(*) as comment_count FROM Comments GROUP BY meme_id) cm
       ON cm.meme_id = m.meme_id
WHERE 1=1
  [AND LOWER(m.title) LIKE :q OR LOWER(m.description) LIKE :q]  -- if q provided
  [AND m.category_id = :categoryId]                              -- if categoryId provided
  [AND m.user_id = :userId]                                      -- if userId provided
ORDER BY like_count DESC, m.created_at DESC  -- if sort=trending
      OR m.created_at DESC                   -- default
```

**Response:** Array of meme objects with like/comment counts.

---

#### POST `/api/memes` 🔒 (requires auth)
**What it does:** Creates a new meme. Supports image upload, video upload, or text-only.

**Request:** `multipart/form-data` (for image/video) or `application/json` (for text)

**Fields:** `title`, `description`, `categoryId`, `memeType` (image/video/text), `file` (for image/video)

**SQL query:**
```sql
INSERT INTO Memes (user_id, category_id, title, image_url, description, meme_type)
VALUES (:userId, :categoryId, :title, :imageUrl, :description, :memeType)

-- Then logs activity:
INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'CREATE_MEME', 'User created image meme: My Meme Title')
```

**Response:** `201 { message: "Meme created successfully" }`

---

#### PUT `/api/memes/:id` 🔒 (requires auth)
**What it does:** Updates a meme. Only the owner can edit their own meme.

**SQL queries:**
```sql
-- 1. Check ownership
SELECT user_id FROM Memes WHERE meme_id = :id

-- 2. Update (only if user_id matches the logged-in user)
UPDATE Memes
SET title = :title, image_url = :imageUrl, description = :description,
    category_id = :categoryId, updated_at = CURRENT_TIMESTAMP
WHERE meme_id = :id

-- 3. Log activity
INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'UPDATE_MEME', 'User updated meme ID: 42')
```

**Error cases:** `403` if you try to edit someone else's meme, `404` if meme doesn't exist.

---

#### DELETE `/api/memes/:id` 🔒 (requires auth)
**What it does:** Deletes a meme. Only the owner can delete their own meme.

**SQL queries:**
```sql
-- 1. Check ownership
SELECT user_id FROM Memes WHERE meme_id = :id

-- 2. Delete (cascades to Likes and Comments automatically via FK)
DELETE FROM Memes WHERE meme_id = :id

-- 3. Log activity
INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'DELETE_MEME', 'User deleted meme ID: 42')
```

---

#### POST `/api/memes/:id/like` 🔒 (requires auth)
**What it does:** Toggles a like. If already liked → unlike. If not liked → like.

**SQL queries:**
```sql
-- 1. Check if already liked
SELECT like_id FROM Likes
WHERE user_id = :userId AND meme_id = :memeId

-- 2a. If liked → delete (unlike)
DELETE FROM Likes WHERE user_id = :userId AND meme_id = :memeId

-- 2b. If not liked → insert (like)
INSERT INTO Likes (user_id, meme_id) VALUES (:userId, :memeId)
```

**Response:** `{ liked: true }` or `{ liked: false }`

---

#### GET `/api/memes/:id/comments`
**What it does:** Returns all comments for a meme, oldest first.

**No auth required.**

**SQL query:**
```sql
SELECT c.comment_id, c.content, c.created_at, u.name as author
FROM Comments c
JOIN Users u ON c.user_id = u.user_id
WHERE c.meme_id = :memeId
ORDER BY c.created_at ASC
```

**Response:** `[{ id, content, createdAt, author }, ...]`

---

#### POST `/api/memes/:id/comments` 🔒 (requires auth)
**What it does:** Posts a new comment on a meme.

**Request body:** `{ "content": "This is hilarious!" }`

**SQL queries:**
```sql
-- 1. Insert comment
INSERT INTO Comments (user_id, meme_id, content)
VALUES (:userId, :memeId, :content)

-- 2. Log activity
INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'ADD_COMMENT', 'Commented on meme 42')
```

**Response:** `201 { message: "Comment added successfully" }`

---

### USERS

#### GET `/api/users/:id/profile`
**What it does:** Returns a user's public profile info and their meme count.

**No auth required.**

**SQL query:**
```sql
SELECT name, email, created_at,
       (SELECT COUNT(*) FROM Memes WHERE user_id = :userId) as meme_count
FROM Users WHERE user_id = :userId
```

**Response:** `{ userId, name, email, createdAt, memeCount }`

---

#### PUT `/api/users/profile` 🔒 (requires auth)
**What it does:** Updates the logged-in user's display name.

**Request body:** `{ "name": "New Name" }`

**SQL queries:**
```sql
UPDATE Users SET name = :name WHERE user_id = :userId

INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'PROFILE_UPDATE', 'Updated name to New Name')
```

**Response:** `{ message, user: { userId, name, email } }`

---

#### PUT `/api/users/change-password` 🔒 (requires auth)
**What it does:** Changes the logged-in user's password after verifying the current one.

**Request body:** `{ "currentPassword": "old123", "newPassword": "new456" }`

**SQL queries:**
```sql
-- 1. Fetch current hash to verify
SELECT password_hash FROM Users WHERE user_id = :userId

-- 2. bcrypt.compare(currentPassword, hash) — done in JS

-- 3. Update with new hash
UPDATE Users SET password_hash = :newHash WHERE user_id = :userId

-- 4. Log activity
INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'CHANGE_PASSWORD', 'User changed their password')
```

**Error cases:** `401` if current password is wrong, `400` if new password < 6 chars.

---

#### POST `/api/auth/forgot-password`
**What it does:** Sends a password reset OTP to the given email. Always returns success to prevent email enumeration.

**Request body:** `{ "email": "john@example.com" }`

**SQL queries:**
```sql
-- 1. Check email exists and is verified
SELECT user_id FROM Users WHERE email = :email AND is_verified = 1

-- 2. Insert OTP
INSERT INTO OTP_Logs (email, otp_code, expires_at, is_used)
VALUES (:email, :otp, :expiresAt, 0)
```

**Then:** Sends the funny MemeHub password reset email.

**Response:** `200 { message: "If that email exists, a reset OTP has been sent." }`

---

#### POST `/api/auth/reset-password`
**What it does:** Verifies the reset OTP and sets a new password.

**Request body:** `{ "email": "john@example.com", "otp": "123456", "newPassword": "newpass123" }`

**SQL queries:**
```sql
-- 1. Find latest matching OTP
SELECT otp_id, expires_at, is_used
FROM (SELECT ... FROM OTP_Logs WHERE email=:email AND otp_code=:otp ORDER BY created_at DESC)
WHERE ROWNUM <= 1

-- 2. Mark OTP used
UPDATE OTP_Logs SET is_used = 1 WHERE otp_id = :otpId

-- 3. Update password
UPDATE Users SET password_hash = :newHash WHERE email = :email
```

**Response:** `200 { message: "Password reset successfully! You can now log in." }`

---

#### GET `/api/memes/:id`
**What it does:** Returns a single meme by ID with full details including categoryId (needed for edit forms).

**No auth required.**

**SQL query:**
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
WHERE m.meme_id = :id
```

**Response:** Single meme object with all fields including `categoryId` and `updatedAt`.

---

### STATS

#### GET `/api/stats/categories`
**What it does:** Returns how many memes exist in each category. Used for the Stats modal.

**No auth required.**

**SQL query:**
```sql
SELECT c.name, COUNT(m.meme_id) as count
FROM Categories c
LEFT JOIN Memes m ON c.category_id = m.category_id
GROUP BY c.name
ORDER BY count DESC
```

**Response:** `[{ category: "Dank Memes", count: 42 }, ...]`

---

## 7. Frontend

### How the app loads

```
Browser opens http://localhost:5173
    │
    └── index.html loads → main.jsx runs → App.jsx renders
            │
            ├── Checks localStorage for 'token' and 'user'
            ├── If found → user is logged in, show Navbar + protected pages
            └── If not found → redirect to /login
```

### Pages

| Page | Route | Who can access | What it does |
|---|---|---|---|
| Login | `/login` | Logged-out only | Email + password form. Shows OTP form if unverified. Has "Forgot password?" link |
| Register | `/register` | Logged-out only | Name + email + password form. Then OTP verification |
| ForgotPassword | `/forgot-password` | Logged-out only | Email → OTP → new password, 3-step flow |
| Dashboard | `/` | Logged-in only | Main meme feed with search, filter, upload. Own memes show edit/delete buttons |
| Profile | `/profile` | Logged-in only | Avatar + stats (meme count, join date), edit name, change password |
| UserProfile | `/user/:id` | Logged-in only | View any user's public profile + their meme grid |

### State Management

There's no Redux or Zustand. State is managed simply:

- `App.jsx` holds the `user` object (name, email, userId) in React state
- The JWT token is stored in `localStorage` under the key `'token'`
- The user object is stored in `localStorage` under the key `'user'`
- On logout, both are removed and `user` state is set to `null`
- When the user updates their name in Profile, `handleUserUpdate` in App.jsx merges the change and updates both state and localStorage

### How API calls are made

All API calls use **Axios**. The base URL is hardcoded as `http://localhost:5000/api`.

For protected routes, every call includes:
```js
headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
```

If any API call returns `401` or `403`, the frontend clears localStorage and redirects to `/login`.

### MemeCard Component

This is the most complex component. It handles:
- Rendering the meme (image / video / text) based on `meme.memeType`
- Like button — calls `onLike(meme.id)` which is handled by the parent (Dashboard or UserProfile)
- Comments toggle — lazy loads comments only when the user clicks the comment button
- Comment form — posts a new comment and refreshes the comment list
- Edit button — visible only to the meme owner. Turns the card into an inline edit form (title, description, category). Saves via `PUT /api/memes/:id` and updates the card in-place without a page reload
- Delete button — visible only to the meme owner. Calls `onDelete(meme.id)` handled by the parent

---

## 8. Data Flow Diagrams

### Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│   React App (Vite dev server: http://localhost:5173)            │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │  Login   │  │Dashboard │  │ Profile  │  │ UserProfile  │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│         │              │             │               │          │
│         └──────────────┴─────────────┴───────────────┘          │
│                              │ Axios HTTP requests               │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                    HTTP (port 5000)
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    EXPRESS BACKEND (Node.js)                     │
│                                                                 │
│   server.js → routes.js                                         │
│                                                                 │
│   Middleware stack:                                             │
│   CORS → JSON parser → Static /uploads → /api routes           │
│                                                                 │
│   Route handlers:                                               │
│   /auth/register  /auth/login  /auth/verify                     │
│   /memes  /memes/:id  /memes/:id/like  /memes/:id/comments      │
│   /categories  /stats/categories  /users/:id/profile            │
│   /users/profile                                                │
│                                                                 │
│   Services:                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │  bcrypt  │  │   JWT    │  │ Nodemailer│  │   Multer     │  │
│   │(passwords)│  │ (tokens) │  │ (emails) │  │(file uploads)│  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │ OracleDB connection pool
┌──────────────────────────────▼──────────────────────────────────┐
│                      ORACLE DATABASE                            │
│                                                                 │
│   Tables: Users, Categories, Memes, Likes, Comments,           │
│           OTP_Logs, Activity_Logs                               │
└─────────────────────────────────────────────────────────────────┘
```

### Meme Feed Load Flow

```
User opens Dashboard
        │
        ▼
useEffect fires (on mount + when search/filter/sort changes)
        │
        ▼
fetchData() runs — 3 parallel API calls:
        │
        ├──► GET /api/memes?q=...&sort=...&categoryId=...
        │         │
        │         ▼ Oracle SQL:
        │         SELECT memes + JOIN users + LEFT JOIN categories
        │         + LEFT JOIN (likes count) + LEFT JOIN (comments count)
        │         WHERE filters apply
        │         ORDER BY created_at or like_count
        │         │
        │         ▼ Returns array of meme objects
        │
        ├──► GET /api/categories
        │         │
        │         ▼ SELECT category_id, name, description FROM Categories
        │         │
        │         ▼ Returns category list for filter bar + upload dropdown
        │
        └──► GET /api/stats/categories
                  │
                  ▼ SELECT c.name, COUNT(memes) GROUP BY c.name
                  │
                  ▼ Returns counts shown on category chips + Stats modal

        │
        ▼
React renders MemeCard for each meme
  - If meme.userId === currentUser.userId → shows Edit (pencil) + Delete (trash) buttons
  - Edit → inline form inside the card → PUT /api/memes/:id → updates card in-place
  - Delete → confirm → DELETE /api/memes/:id → removes from feed
```

### File Upload Flow

```
User clicks "Upload Meme" → selects image file → fills form → clicks "Post Meme"
        │
        ▼
Dashboard.handleUpload() builds FormData:
  { title, description, categoryId, memeType: 'image', file: <binary> }
        │
        ▼
POST /api/memes  (multipart/form-data)
  Header: Authorization: Bearer <token>
        │
        ▼
authenticateToken middleware verifies JWT
        │
        ▼
Multer middleware intercepts the file:
  - Saves to uploads/1234567890-987654321.jpg on disk
  - Sets req.file.filename
        │
        ▼
Route handler:
  fileUrl = '/uploads/1234567890-987654321.jpg'
        │
        ▼
INSERT INTO Memes (user_id, category_id, title, image_url, description, meme_type)
VALUES (1, 3, 'My Meme', '/uploads/1234567890-987654321.jpg', 'desc', 'image')
        │
        ▼
Response: 201 { message: "Meme created successfully" }
        │
        ▼
Dashboard calls fetchData() to refresh the feed
        │
        ▼
MemeCard renders: <img src="http://localhost:5000/uploads/1234567890-987654321.jpg" />
  (Express serves the file from the uploads/ folder as a static asset)
```

---

## 9. Authentication Flow

### Registration + Email Verification

```
STEP 1: User fills Register form
        │
        ▼
POST /api/auth/register { name, email, password }
        │
        ├── Validate: name, email, password present; password >= 6 chars
        ├── bcrypt.hash(password, 10) → hashed password
        ├── INSERT INTO Users ... is_verified=0
        ├── Generate random 6-digit OTP (e.g. "847291")
        ├── INSERT INTO OTP_Logs (email, otp, expires_at=now+10min, is_used=0)
        └── Send email via Gmail: "Your OTP is: 847291"
        │
        ▼
Response: 201 "User registered. Please check email for OTP."
        │
        ▼
STEP 2: Frontend shows OTP input form
        │
        ▼
POST /api/auth/verify { email, otp: "847291" }
        │
        ├── SELECT latest OTP for this email+code
        ├── Check: is_used=0? expires_at > now?
        ├── UPDATE OTP_Logs SET is_used=1
        ├── UPDATE Users SET is_verified=1
        ├── SELECT user_id, name FROM Users
        └── jwt.sign({ userId, email, name }, JWT_SECRET, { expiresIn: '24h' })
        │
        ▼
Response: 200 { token, user: { userId, name, email } }
        │
        ▼
STEP 3: Frontend stores token + user in localStorage
        App.jsx sets user state → redirects to Dashboard
```

### Login Flow

```
User fills Login form { email, password }
        │
        ▼
POST /api/auth/login
        │
        ├── SELECT user_id, name, password_hash, is_verified FROM Users WHERE email=?
        │
        ├── If not found → 401 "Invalid credentials"
        │
        ├── bcrypt.compare(password, hash)
        │   └── If no match → 401 "Invalid credentials"
        │
        ├── If is_verified=0:
        │   ├── Generate new OTP, INSERT INTO OTP_Logs
        │   ├── Send OTP email
        │   └── 403 "Email not verified. A new OTP has been sent."
        │       (Frontend shows OTP form)
        │
        └── If verified:
            ├── INSERT INTO Activity_Logs (LOGIN)
            ├── jwt.sign({ userId, email, name })
            └── 200 { token, user }
```

### JWT Token Lifecycle

```
Token created at login/verify
    │
    ├── Stored in localStorage['token']
    ├── Sent with every protected request: Authorization: Bearer <token>
    ├── Backend verifies with jwt.verify(token, JWT_SECRET)
    ├── If valid → req.user = { userId, email, name }
    ├── If invalid/expired → 403 Forbidden
    └── Expires after 24 hours
            │
            ▼
        Frontend detects 401/403 → clears localStorage → redirects to /login
```

---

## 10. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=5000                          # Port the backend runs on
DB_USER=your_oracle_db_user        # Oracle DB username (e.g. system)
DB_PASSWORD=your_oracle_db_password # Oracle DB password
DB_CONNECTION_STRING=localhost:1521/XE  # Oracle connection string
JWT_SECRET=your_jwt_secret_key     # Any long random string for signing tokens
EMAIL_USER=your_email@gmail.com    # Gmail address for sending OTPs
EMAIL_PASS=your_gmail_app_password # Gmail App Password (not your real password)
```

> For Gmail, you need to enable 2FA and create an "App Password" at myaccount.google.com/apppasswords

---

## 11. How to Run

### Prerequisites
- Node.js 18+
- Oracle Database XE (or any Oracle instance)
- Oracle Instant Client (for the `oracledb` npm package)

### Step 1: Set up the database

```bash
# Option A: Run the SQL file in Oracle SQL*Plus or SQL Developer
# Open db_setup.sql and run it

# Option B: Use the JS init script
node init_db.js
```

### Step 2: Configure environment

```bash
cp .env.example .env
# Edit .env with your Oracle DB credentials, JWT secret, and Gmail credentials
```

### Step 3: Start the backend

```bash
npm install
npm run dev        # development (auto-restarts on changes)
# or
npm start          # production
```

Backend runs at: `http://localhost:5000`

### Step 4: Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Step 5: Open the app

Go to `http://localhost:5173` in your browser.

---

## Quick Reference — All API Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/verify` | No | Verify OTP |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/forgot-password` | No | Request password reset OTP |
| POST | `/api/auth/reset-password` | No | Reset password with OTP |
| GET | `/api/categories` | No | List all categories |
| GET | `/api/memes` | No | List memes (with filters) |
| GET | `/api/memes/:id` | No | Get single meme |
| POST | `/api/memes` | Yes | Create a meme |
| PUT | `/api/memes/:id` | Yes | Update a meme |
| DELETE | `/api/memes/:id` | Yes | Delete a meme |
| POST | `/api/memes/:id/like` | Yes | Toggle like |
| GET | `/api/memes/:id/comments` | No | Get comments |
| POST | `/api/memes/:id/comments` | Yes | Post a comment |
| GET | `/api/users/:id/profile` | No | Get user profile |
| PUT | `/api/users/profile` | Yes | Update own display name |
| PUT | `/api/users/change-password` | Yes | Change own password |
| GET | `/api/stats/categories` | No | Category meme counts |

---

*Generated by Kiro — April 2026*
