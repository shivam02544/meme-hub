# 🧠 MemeHub — Full Stack System Documentation
> Complete reference for Viva / Interview / Code Review · Last updated: March 2026

---

## 📋 Table of Contents
1. [Project Overview (Viva-Ready)](#1-project-overview-viva-ready)
2. [System Architecture Diagram](#2-system-architecture-diagram)
3. [DFD — Level 0 (Context Diagram)](#3-dfd--level-0-context-diagram)
4. [DFD — Level 1 (System Processes)](#4-dfd--level-1-system-processes)
5. [DFD — Level 2 (Detailed Sub-Processes)](#5-dfd--level-2-detailed-sub-processes)
6. [Frontend ↔ Backend Interaction](#6-frontend--backend-interaction)
7. [Route Reference with SQL Queries](#7-route-reference-with-sql-queries)
8. [Database Schema (ERD)](#8-database-schema-erd)
9. [Component DFS Map](#9-component-dfs-map)
10. [Deployment (AWS)](#10-deployment-aws)
11. [Environment Variables](#11-environment-variables)

---

## 1. Project Overview (Viva-Ready)

### 🎯 What is MemeHub?
MemeHub is a **full-stack meme collection and sharing web application** built with:

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + React Router v6 |
| **Backend** | Node.js + Express.js (ES Modules) |
| **Database** | Oracle Database (XE) |
| **Auth** | Email OTP → JWT Token |
| **File Storage** | Local disk via Multer (`/uploads/`) |
| **Email** | Gmail SMTP via Nodemailer |

### 🔑 Key Features
- **Secure Auth** — Email OTP verification before login is allowed (no plaintext passwords stored — bcrypt hashed)
- **Multi-format Memes** — Supports image upload, video upload, external URL, and text-only memes
- **Real-time Counts** — Like and comment counts are computed via correlated SQL subqueries on every fetch
- **Role Enforcement** — Users can only edit/delete their own memes (ownership check before every mutation)
- **Activity Logging** — Every significant action writes to `Activity_Logs` table for auditability
- **Trending Sort** — Memes can be sorted by recency (default) or by likes (trending)

### 🧩 How to Explain in Viva
> *"The user registers with name/email/password. The backend hashes the password with bcrypt, inserts the user (unverified), generates a 6-digit OTP, stores it in OTP_Logs table, and emails it via Gmail SMTP. The user submits the OTP, server validates it against the DB, marks the user verified, and issues a 24-hour JWT. All subsequent protected requests carry this JWT in the Authorization header. The frontend is a React SPA using React Router — it reads the token from localStorage and attaches it to every API call via the Authorization header."*

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT  (Browser)                                │
│                                                                         │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Login   │  │  Register  │  │Dashboard │  │ Profile  │  │UserProf│ │
│  │  .jsx    │  │  .jsx      │  │  .jsx    │  │  .jsx    │  │  .jsx  │ │
│  └─────┬────┘  └─────┬──────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│        │             │              │              │             │      │
│        └─────────────┴──────────────┴──────────────┴─────────────┘      │
│                                    │                                    │
│                              fetch() / Axios                            │
│                         Authorization: Bearer JWT                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │  HTTP (port 5173 dev / 80 prod)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     BACKEND  (Node.js + Express)                        │
│                                                                         │
│   server.js                                                             │
│    ├── cors()           ← Allows cross-origin from React               │
│    ├── express.json()   ← Parses JSON body                             │
│    ├── /uploads static  ← Serves uploaded media files                  │
│    └── /api → routes.js                                                │
│                                                                         │
│   routes.js                                                             │
│    ├── authenticateToken (JWT middleware)                               │
│    ├── multer (file upload middleware)                                  │
│    ├── AUTH     → /auth/register, /auth/verify, /auth/login            │
│    ├── MEMES    → GET/POST/PUT/DELETE /memes                           │
│    ├── ENGAGE   → /memes/:id/like, /comments                          │
│    ├── STATS    → /stats/categories                                    │
│    └── USERS    → /users/:id/profile, /users/profile                  │
│                                                                         │
│   db.js                                                                 │
│    └── oracledb.createPool() → Connection Pool (min:2, max:10)         │
│                                                                         │
│   Nodemailer (Gmail SMTP) ──────────────────────────────────────────►  │
│                                                        Gmail API        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │  Oracle Net (port 1521)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ORACLE DATABASE  (XE / ATP)                          │
│                                                                         │
│   Users ──────────────────────────────────► OTP_Logs                   │
│     │                                       Activity_Logs              │
│     └──► Memes ──────►  Likes                                          │
│                    └──►  Comments                                       │
│   Categories ──────────►  Memes                                        │
│                                                                         │
│   Connection Pool: poolMin=2, poolMax=10, poolIncrement=1              │
│   CLOB fetch mode: oracledb.fetchAsString (avoids handle leaks)        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. DFD — Level 0 (Context Diagram)

> Shows the **entire system as a single process** with external entities.

```
                ┌──────────────┐
                │              │
   Register ──► │              │ ──► OTP Email
   Login ──────►│   MemeHub    │
   View Memes ──│   System     │ ──► JWT Token
   Upload ─────►│              │
   Like/Comment►│  (Process 0) │ ──► Meme Feed
                │              │
                └──────┬───────┘
                       │
              READ / WRITE
                       │
                       ▼
            ┌──────────────────────┐
            │   Oracle Database    │
            │  (Data Store)        │
            └──────────────────────┘

External Entities:
  👤  User (Browser)
  📧  Gmail SMTP Server
```

---

## 4. DFD — Level 1 (System Processes)

> Breaks the system into **5 major processes** with data flows between them.

```
User ──────────────────────────────────────────────────────────────────────
 │
 │  name, email, password          ┌─────────────────────┐
 ├──────────────────────────────►  │  P1: User           │
 │                                 │  Authentication     │──► OTP Email (Gmail)
 │  email, OTP                     │                     │
 ├──────────────────────────────►  │  Register/Verify/   │──► JWT Token ──────────┐
 │                                 │  Login              │                        │
 │  email, password                │                     │◄──── D1: Users ────────┤
 └──────────────────────────────►  │                     │◄──── D2: OTP_Logs ─────┤
                                   └─────────────────────┘                        │
                                                                                   │
 JWT + search/filter ─────────────►┌─────────────────────┐                        │
                                   │  P2: Meme           │◄───── D3: Memes ───────┤
 Upload / URL ─────────────────►   │  Management         │◄───── D4: Categories ──┤
                                   │  (CRUD)             │                        │
 Meme list / meme data ◄─────────  │                     │──► D5: Activity_Logs   │
                                   └─────────────────────┘         (write)        │
                                                                                   │
 JWT + meme_id ────────────────►  ┌─────────────────────┐                        │
                                   │  P3: Engagement     │◄───── D6: Likes ───────┤
 liked / unliked ◄───────────────  │  (Likes/Comments)   │◄───── D7: Comments ────┤
 comments list ◄─────────────────  │                     │                        │
                                   └─────────────────────┘                        │
                                                                                   │
 (public) ─────────────────────►  ┌─────────────────────┐                        │
                                   │  P4: Statistics     │◄──── D3, D4 ───────────┤
 category stats ◄────────────────  │  & Reporting        │                        │
                                   └─────────────────────┘                        │
                                                                                   │
 JWT ──────────────────────────►  ┌─────────────────────┐                        │
                                   │  P5: User Profile   │◄──── D1: Users ────────┘
 updated name ◄──────────────────  │  Management         │
 public profile ◄────────────────  │                     │──► D5: Activity_Logs
                                   └─────────────────────┘
```

**Data Stores:**

| ID | Store | Table |
|---|---|---|
| D1 | Users | `Users` |
| D2 | OTP Records | `OTP_Logs` |
| D3 | Memes | `Memes` |
| D4 | Categories | `Categories` |
| D5 | Audit Trail | `Activity_Logs` |
| D6 | Likes | `Likes` |
| D7 | Comments | `Comments` |

---

## 5. DFD — Level 2 (Detailed Sub-Processes)

### P1 — User Authentication (Expanded)

```
                ┌───────────────────────────────────────────────┐
                │           P1: User Authentication             │
                │                                               │
name,email,pw ──►  P1.1: Hash Password (bcrypt, 10 rounds)      │
                │     │                                         │
                │     ▼                                         │
                │  P1.2: INSERT into Users (is_verified=0)  ────►  D1: Users
                │     │          (RETURNING user_id)             │
                │     ▼                                         │
                │  P1.3: Generate OTP (6-digit, 10min TTL)      │
                │     │                                         │
                │     ├──►  INSERT into OTP_Logs  ─────────────►  D2: OTP_Logs
                │     │                                         │
                │     └──►  sendOTP(email, otp)  ──────────────►  Gmail SMTP
                │                                               │
email,otp ──────►  P1.4: Validate OTP                           │
                │     │   SELECT from OTP_Logs (ROWNUM <= 1)    │
                │     │   check is_used & expires_at            │
                │     ▼                                         │
                │  P1.5: Mark OTP used + User verified          │
                │     │   UPDATE OTP_Logs SET is_used=1         │
                │     │   UPDATE Users SET is_verified=1        │
                │     ▼                                         │
                │  P1.6: Sign JWT (24h expiry)  ───────────────►  JWT Token (to client)
                │                                               │
email,password──►  P1.7: Login Validation                       │
                │     │   SELECT user + bcrypt.compare()        │
                │     │   if unverified → re-run P1.3/sendOTP   │
                │     └──►  Sign JWT if verified                │
                └───────────────────────────────────────────────┘
```

### P2 — Meme Management (Expanded)

```
                ┌───────────────────────────────────────────────┐
                │           P2: Meme Management                 │
                │                                               │
GET /memes ──────►  P2.1: Build Dynamic SQL Query               │
                │     │   Base: JOIN Memes+Users+Categories      │
                │     │   Optional filters: q, categoryId,      │
                │     │   userId, sort (trending/newest)        │
                │     │   Correlated subqueries: like_count,    │
                │     │   comment_count                         │
                │     └──►  SELECT → D3,D4,D6,D7  (read)       │
                │                                               │
POST /memes ─────►  P2.2: File Handling (Multer)                │
(multipart form)│     │   diskStorage → /uploads/<ts>.<ext>     │
                │     │   fileFilter: image/video types only    │
                │     │   sizeLimit: 50MB                       │
                │     ▼                                         │
                │  P2.3: INSERT Meme record  ───────────────────►  D3: Memes
                │         (userId, categoryId, title,           │
                │          image_url, description, meme_type)   │
                │     └──►  logActivity('CREATE_MEME')  ────────►  D5: Activity_Logs
                │                                               │
PUT /memes/:id ──►  P2.4: Ownership Check                       │
                │     │   SELECT user_id FROM Memes             │
                │     │   Compare with JWT userId               │
                │     ▼                                         │
                │  P2.5: UPDATE Memes  ─────────────────────────►  D3: Memes
                │         SET updated_at = CURRENT_TIMESTAMP    │
                │     └──►  logActivity('UPDATE_MEME')          │
                │                                               │
DELETE /memes/:id►  P2.6: Ownership Check (same as P2.4)        │
                │     ▼                                         │
                │  P2.7: DELETE Memes   ────────────────────────►  D3: Memes
                │         (cascade deletes Likes + Comments)    │
                │     └──►  logActivity('DELETE_MEME')          │
                └───────────────────────────────────────────────┘
```

### P3 — Engagement (Expanded)

```
                ┌───────────────────────────────────────────────┐
                │           P3: Engagement                      │
                │                                               │
POST .../like ───►  P3.1: Check existing like                   │
                │     │   SELECT like_id FROM Likes             │
                │     │   WHERE user_id AND meme_id             │
                │     │                                         │
                │     ├── found ──►  P3.2a: DELETE Likes  ──────►  D6: Likes
                │     │                    return {liked:false} │
                │     └── not found─►  P3.2b: INSERT Likes ─────►  D6: Likes
                │                          return {liked:true}  │
                │                                               │
GET .../comments►  P3.3: SELECT Comments + JOIN Users           │
                │     │   WHERE meme_id ORDER BY created_at ASC │
                │     └──►  return comment list  ───────────────►  D7: Comments
                │                                               │
POST .../comments►  P3.4: Validate content (non-empty)          │
                │     │   INSERT into Comments                  │
                │     └──►  logActivity('ADD_COMMENT')  ─────── ►  D5: Activity_Logs
                └───────────────────────────────────────────────┘
```

---

## 6. Frontend ↔ Backend Interaction

### Route Mapping (React Page → API Calls)

| React Page / Component | API Calls Made | Auth |
|---|---|---|
| `Register.jsx` | `POST /api/auth/register` → `POST /api/auth/verify` | ❌ |
| `Login.jsx` | `POST /api/auth/login` | ❌ |
| `Dashboard.jsx` | `GET /api/memes`, `GET /api/categories`, `GET /api/stats/categories`, `POST /api/memes`, `POST /api/memes/:id/like`, `GET + POST /api/memes/:id/comments`, `DELETE /api/memes/:id` | ✅ JWT |
| `Profile.jsx` | `PUT /api/users/profile` | ✅ JWT |
| `UserProfile.jsx` | `GET /api/users/:id/profile`, `GET /api/memes?userId=...` | ✅ JWT |
| `MemeCard` (component) | `POST /api/memes/:id/like`, `GET /api/memes/:id/comments` | ✅ JWT |

### Auth Token Flow

```
1. User logs in / verifies OTP
       │
       ▼
2. Server returns { token, user }
       │
       ▼
3. React saves to localStorage:
   localStorage.setItem('token', token)
   localStorage.setItem('user', JSON.stringify(user))
       │
       ▼
4. App.jsx reads from localStorage on refresh (useEffect)
   → restores session without re-login
       │
       ▼
5. Every protected API call attaches:
   headers: { Authorization: `Bearer ${token}` }
       │
       ▼
6. Backend authenticateToken() middleware:
   jwt.verify(token, JWT_SECRET)
   → sets req.user = { userId, email, name }
       │
       ▼
7. On logout: localStorage.clear() → user state = null
   → React Router redirects to /login
```

### Sequence Diagram — Upload a Meme

```
React (Dashboard.jsx)          Express Backend             Oracle DB
       │                              │                        │
       │── POST /api/memes ──────────►│                        │
       │   Content-Type: multipart    │                        │
       │   Authorization: Bearer JWT  │                        │
       │   body: { title, categoryId, │                        │
       │           memeType, file }   │                        │
       │                              │                        │
       │                        authenticateToken()            │
       │                        multer.single('file')          │
       │                        → saves to /uploads/           │
       │                              │                        │
       │                              │── INSERT Memes ───────►│
       │                              │── INSERT Activity_Logs►│
       │                              │                        │
       │◄── 201 { message: "Meme     │                        │
       │    created successfully" } ──│                        │
       │                              │                        │
       │── GET /api/memes ───────────►│                        │
       │   (refresh feed)             │── SELECT Memes... ────►│
       │◄── 200 [...memes] ───────────│                        │
       │                              │                        │
  Dashboard re-renders
  with new meme in feed
```

### Sequence Diagram — Register + OTP Verify

```
React (Register.jsx)          Express Backend          Gmail SMTP    Oracle DB
       │                              │                     │             │
       │── POST /api/auth/register ──►│                     │             │
       │   {name, email, password}    │── bcrypt.hash() ───►│             │
       │                              │── INSERT Users ─────────────────►│
       │                              │── INSERT OTP_Logs ───────────────►│
       │                              │── sendMail(otp) ───►│             │
       │◄── 201 "OTP sent" ───────────│                     │             │
       │                              │                     │             │
  User checks email, gets OTP         │                     │             │
       │                              │                     │             │
       │── POST /api/auth/verify ────►│                     │             │
       │   {email, otp}               │── SELECT OTP_Logs ───────────────►│
       │                              │── UPDATE OTP_Logs ───────────────►│
       │                              │── UPDATE Users ─────────────────►│
       │                              │── jwt.sign() ───────│             │
       │◄── 200 {token, user} ────────│                     │             │
       │                              │                     │             │
  React saves token + user to
  localStorage → redirects to /
```

---

## 7. Route Reference with SQL Queries

### 🔐 AUTH

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register + send OTP |
| POST | `/api/auth/verify` | ❌ | Verify OTP → get JWT |
| POST | `/api/auth/login` | ❌ | Login → get JWT |

<details>
<summary><strong>POST /api/auth/register</strong></summary>

```sql
INSERT INTO Users (name, email, password_hash, is_verified)
VALUES (:name, :email, :password, 0) RETURNING user_id INTO :userId

INSERT INTO OTP_Logs (email, otp_code, expires_at, is_used)
VALUES (:email, :otp, :expiresAt, 0)

INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'REGISTER', 'User registered, OTP sent')
```
</details>

<details>
<summary><strong>POST /api/auth/verify</strong></summary>

```sql
-- Get latest matching OTP
SELECT * FROM (
  SELECT otp_id, expires_at, is_used FROM OTP_Logs
  WHERE email = :email AND otp_code = :otp
  ORDER BY created_at DESC
) WHERE ROWNUM <= 1

UPDATE OTP_Logs SET is_used = 1 WHERE otp_id = :otpId
UPDATE Users SET is_verified = 1 WHERE email = :email
SELECT user_id, name FROM Users WHERE email = :email
```
</details>

<details>
<summary><strong>POST /api/auth/login</strong></summary>

```sql
SELECT user_id, name, password_hash, is_verified FROM Users WHERE email = :email
-- if unverified: INSERT INTO OTP_Logs (resend OTP)
INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'LOGIN', 'User logged in')
```
</details>

---

### 📂 CATEGORIES

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/categories` | ❌ | All categories A-Z |

```sql
SELECT category_id, name, description FROM Categories ORDER BY name ASC
```

---

### 🖼️ MEMES

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/memes` | ❌ | List memes (filterable/sortable) |
| POST | `/api/memes` | ✅ | Create meme |
| PUT | `/api/memes/:id` | ✅ | Update meme (owner only) |
| DELETE | `/api/memes/:id` | ✅ | Delete meme (owner only) |

<details>
<summary><strong>GET /api/memes — Dynamic Query</strong></summary>

```sql
SELECT m.meme_id, m.title, m.image_url, m.description, m.created_at,
       u.name as author, c.name as category, m.meme_type, m.user_id,
       (SELECT COUNT(*) FROM Likes l WHERE l.meme_id = m.meme_id) as like_count,
       (SELECT COUNT(*) FROM Comments cm WHERE cm.meme_id = m.meme_id) as comment_count
FROM Memes m
JOIN Users u ON m.user_id = u.user_id
LEFT JOIN Categories c ON m.category_id = c.category_id
WHERE 1=1
  [AND LOWER(m.title) LIKE :q OR LOWER(m.description) LIKE :q]  -- if ?q=
  [AND m.category_id = :categoryId]                              -- if ?categoryId=
  [AND m.user_id = :userId]                                      -- if ?userId=
ORDER BY [like_count DESC, m.created_at DESC | m.created_at DESC]
```
</details>

<details>
<summary><strong>POST /api/memes</strong></summary>

```sql
INSERT INTO Memes (user_id, category_id, title, image_url, description, meme_type)
VALUES (:userId, :categoryId, :title, :imageUrl, :description, :memeType)

INSERT INTO Activity_Logs (user_id, action, details)
VALUES (:userId, 'CREATE_MEME', 'User created <type> meme: <title>')
```
</details>

<details>
<summary><strong>PUT /api/memes/:id</strong></summary>

```sql
SELECT user_id FROM Memes WHERE meme_id = :id   -- ownership check
UPDATE Memes SET title=:title, image_url=:imageUrl, description=:description,
    category_id=:categoryId, updated_at=CURRENT_TIMESTAMP WHERE meme_id=:id
```
</details>

<details>
<summary><strong>DELETE /api/memes/:id</strong></summary>

```sql
SELECT user_id FROM Memes WHERE meme_id = :id   -- ownership check
DELETE FROM Memes WHERE meme_id = :id            -- cascades Likes + Comments
```
</details>

---

### ❤️ ENGAGEMENT

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/memes/:id/like` | ✅ | Toggle like/unlike |
| GET | `/api/memes/:id/comments` | ❌ | Get comments |
| POST | `/api/memes/:id/comments` | ✅ | Post comment |

```sql
-- Toggle like
SELECT like_id FROM Likes WHERE user_id=:userId AND meme_id=:memeId
DELETE FROM Likes WHERE user_id=:userId AND meme_id=:memeId   -- if liked
INSERT INTO Likes (user_id, meme_id) VALUES (:userId, :memeId) -- if not liked

-- Get comments
SELECT c.comment_id, c.content, c.created_at, u.name as author
FROM Comments c JOIN Users u ON c.user_id = u.user_id
WHERE c.meme_id = :memeId ORDER BY c.created_at ASC

-- Post comment
INSERT INTO Comments (user_id, meme_id, content) VALUES (:userId, :memeId, :content)
```

---

### 📊 STATS & USERS

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/stats/categories` | ❌ | Meme count per category |
| GET | `/api/users/:id/profile` | ❌ | Public user profile |
| PUT | `/api/users/profile` | ✅ | Update own display name |

```sql
-- Category stats
SELECT c.name, COUNT(m.meme_id) as count
FROM Categories c LEFT JOIN Memes m ON c.category_id = m.category_id
GROUP BY c.name ORDER BY count DESC

-- User profile
SELECT name, email, created_at,
       (SELECT COUNT(*) FROM Memes WHERE user_id = :userId) as meme_count
FROM Users WHERE user_id = :userId

-- Update profile
UPDATE Users SET name = :name WHERE user_id = :userId
```

---

## 8. Database Schema (ERD)

```
┌──────────────────┐          ┌──────────────────┐
│   Categories     │          │     Users         │
│──────────────────│          │──────────────────│
│ category_id (PK) │          │ user_id (PK)      │
│ name UNIQUE      │          │ name              │
│ description      │          │ email UNIQUE      │
└────────┬─────────┘          │ password_hash     │
         │                    │ is_verified (0/1) │
         │ FK (SET NULL)      │ created_at        │
         │                    └────────┬──────────┘
         │                             │
         ▼                             │ FK (CASCADE)
┌──────────────────────────────────────│──────────────────────┐
│                    Memes             │                      │
│───────────────────────────────────── │ ─────────────────────│
│ meme_id (PK)                         │                      │
│ user_id ─────────────────────────────┘  (FK → Users)        │
│ category_id ──────────────────────────────── (FK → Cat.)    │
│ title                                                        │
│ image_url (nullable for text memes)                          │
│ description (CLOB)                                           │
│ meme_type: 'image' | 'video' | 'text'                        │
│ created_at, updated_at                                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
          ┌────────┴───────────────┐
          │                        │
          ▼                        ▼
┌──────────────────┐      ┌───────────────────┐
│     Likes        │      │     Comments      │
│──────────────────│      │───────────────────│
│ like_id (PK)     │      │ comment_id (PK)   │
│ user_id (FK)     │      │ user_id (FK)      │
│ meme_id (FK)     │      │ meme_id (FK)      │
│ created_at       │      │ content (CLOB)    │
│ UNIQUE(user,meme)│      │ created_at        │
└──────────────────┘      └───────────────────┘

┌──────────────────┐      ┌───────────────────┐
│    OTP_Logs      │      │  Activity_Logs    │
│──────────────────│      │───────────────────│
│ otp_id (PK)      │      │ log_id (PK)       │
│ email (FK→Users) │      │ user_id (FK)      │
│ otp_code         │      │ action            │
│ expires_at       │      │ details (CLOB)    │
│ is_used (0/1)    │      │ log_timestamp     │
│ created_at       │      └───────────────────┘
└──────────────────┘
```

**Cascade Rules:**
- Delete `Users` → cascades to: `Memes`, `Likes`, `Comments`, `OTP_Logs`, `Activity_Logs`
- Delete `Memes` → cascades to: `Likes`, `Comments`  
- Delete `Categories` → sets `Memes.category_id = NULL` (SET NULL)

---

## 9. Component DFS Map

```
HTTP Request
└── server.js                           ← Entry point
    ├── cors()
    ├── express.json()
    ├── express.static('/uploads')
    └── /api → routes.js
        │
        ├─► [MIDDLEWARE] authenticateToken()
        │       └── jwt.verify(token, JWT_SECRET)
        │               └── req.user = { userId, email, name }
        │
        ├─► [MIDDLEWARE] multer.single('file')
        │       ├── diskStorage → uploads/<ts-rand>.<ext>
        │       └── fileFilter → image/video types, 50MB max
        │
        ├─► [HELPER] logActivity(userId, action, details)
        │       └── getPool() → connection.execute()
        │               └── INSERT Activity_Logs
        │
        ├─► [HELPER] sendOTP(email, otp)
        │       └── nodemailer.transporter.sendMail()
        │               └── Gmail SMTP (process.env.EMAIL_USER/PASS)
        │
        ├─► AUTH ROUTES
        │   ├── POST /auth/register
        │   │   ├── bcrypt.hash(password, 10)
        │   │   ├── db → INSERT Users (RETURNING user_id)
        │   │   ├── db → INSERT OTP_Logs
        │   │   ├── sendOTP()
        │   │   └── logActivity('REGISTER')
        │   │
        │   ├── POST /auth/verify
        │   │   ├── db → SELECT OTP_Logs (ROWNUM<=1, ordered by created_at)
        │   │   ├── validate: is_used=0, expires_at > NOW
        │   │   ├── db → UPDATE OTP_Logs (is_used=1)
        │   │   ├── db → UPDATE Users (is_verified=1)
        │   │   ├── db → SELECT Users (get userId/name)
        │   │   ├── jwt.sign({ userId, email, name }, 24h)
        │   │   └── logActivity('VERIFY_OTP')
        │   │
        │   └── POST /auth/login
        │       ├── db → SELECT Users (email lookup)
        │       ├── bcrypt.compare(password, hash)
        │       ├── [unverified] INSERT OTP_Logs + sendOTP()
        │       ├── jwt.sign({ userId, email, name }, 24h)
        │       └── logActivity('LOGIN')
        │
        ├─► CATEGORY ROUTES
        │   └── GET /categories
        │       └── db → SELECT Categories ORDER BY name ASC
        │
        ├─► MEME ROUTES
        │   ├── GET /memes
        │   │   └── db → Dynamic SELECT (Memes+Users+Categories)
        │   │           with optional: q, categoryId, userId, sort
        │   │           subqueries: like_count, comment_count
        │   │
        │   ├── POST /memes           [authenticateToken + multer]
        │   │   ├── multer → save file OR use imageUrl OR null (text)
        │   │   ├── db → INSERT Memes
        │   │   └── logActivity('CREATE_MEME')
        │   │
        │   ├── PUT /memes/:id        [authenticateToken]
        │   │   ├── db → SELECT Memes (ownership check)
        │   │   ├── db → UPDATE Memes (title, imageUrl, desc, category, updated_at)
        │   │   └── logActivity('UPDATE_MEME')
        │   │
        │   └── DELETE /memes/:id    [authenticateToken]
        │       ├── db → SELECT Memes (ownership check)
        │       ├── db → DELETE Memes (cascade: Likes, Comments)
        │       └── logActivity('DELETE_MEME')
        │
        ├─► ENGAGEMENT ROUTES
        │   ├── POST /memes/:id/like  [authenticateToken]
        │   │   ├── db → SELECT Likes (check existing)
        │   │   └── db → DELETE Likes (unlike) OR INSERT Likes (like)
        │   │
        │   ├── GET /memes/:id/comments
        │   │   └── db → SELECT Comments JOIN Users ORDER BY created_at ASC
        │   │
        │   └── POST /memes/:id/comments [authenticateToken]
        │       ├── validate: content non-empty
        │       ├── db → INSERT Comments
        │       └── logActivity('ADD_COMMENT')
        │
        ├─► STATS ROUTES
        │   └── GET /stats/categories
        │       └── db → SELECT Categories LEFT JOIN Memes GROUP BY c.name
        │
        └─► USER ROUTES
            ├── GET /users/:id/profile
            │   └── db → SELECT Users + subquery COUNT(Memes)
            │
            └── PUT /users/profile    [authenticateToken]
                ├── db → UPDATE Users SET name=:name
                └── logActivity('PROFILE_UPDATE')
```

---

## 10. Deployment (AWS)

### Recommended Architecture (Production)

```
Internet
    │
    ▼
┌─────────────────────────┐
│  Route 53 (DNS)         │  memehub.com → ALB
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  CloudFront (CDN)       │  Static assets + /uploads media
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  S3 Bucket              │  React build (index.html + assets)
│  + frontend hosting     │  Meme uploads (replaces local /uploads)
└─────────────────────────┘

┌─────────────────────────┐
│  ALB (Load Balancer)    │  SSL termination (ACM cert)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  EC2 / Elastic          │  Node.js Express backend
│  Beanstalk              │  Process manager: PM2
│                         │  node server.js (port 5000)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Oracle Autonomous DB   │  Oracle ATP (Autonomous Transaction
│  (ATP) on OCI           │  Processing) — or RDS if using Postgres
│  OR: Oracle on EC2      │
└─────────────────────────┘
```

### Deployment Steps

#### Option A — Elastic Beanstalk (Easiest)

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialise EB project in backend folder
eb init memehub-backend --platform node.js --region ap-south-1

# 3. Create environment
eb create memehub-prod

# 4. Set environment variables (replaces .env)
eb setenv \
  DB_USER=system \
  DB_PASSWORD=yourpassword \
  DB_CONNECTION_STRING=your-oracle-host/xe \
  JWT_SECRET=your-jwt-secret \
  EMAIL_USER=youremail@gmail.com \
  EMAIL_PASS=yourapppassword \
  PORT=5000

# 5. Deploy
eb deploy
```

#### Option B — EC2 Manual Deploy

```bash
# On EC2 instance (Amazon Linux 2)
sudo yum install -y nodejs git
git clone https://github.com/you/memehub-backend .
npm install

# Install PM2 process manager
npm install -g pm2
pm2 start server.js --name memehub
pm2 save
pm2 startup

# Nginx reverse proxy (port 80 → 5000)
sudo yum install -y nginx
# Configure /etc/nginx/conf.d/memehub.conf:
# location / { proxy_pass http://localhost:5000; }
sudo systemctl start nginx
```

#### Frontend Deploy (S3 + CloudFront)

```bash
# Build React app
cd frontend
npm run build

# Upload dist/ to S3
aws s3 sync dist/ s3://memehub-frontend/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### Production Checklist

| Item | Status |
|---|---|
| `.env` not committed | Use EB env vars or AWS Secrets Manager |
| JWT_SECRET strong | Minimum 32 random characters |
| HTTPS enabled | ACM cert on ALB |
| `/uploads` → S3 | Replace local disk with `multer-s3` package |
| Oracle ATP | Use wallet-based connection string |
| CORS locked | Set origin to prod domain only |
| PM2 / health checks | Auto-restart on crash |
| Rate limiting | Add `express-rate-limit` on auth routes |
| Oracle pool sizing | poolMin=2, poolMax=10 (tune per EC2 size) |

### Environment Variables (Production)

| Variable | Local | Production |
|---|---|---|
| `PORT` | `5000` | Set by EB (8080 default) |
| `DB_USER` | `system` | Oracle ATP username |
| `DB_PASSWORD` | local pw | AWS Secrets Manager |
| `DB_CONNECTION_STRING` | `localhost/xe` | ATP wallet connection string |
| `JWT_SECRET` | any string | 32+ char random secret |
| `EMAIL_USER` | Gmail addr | Same or SES |
| `EMAIL_PASS` | App password | App password / SES SMTP |

---

## 11. Environment Variables

```env
# .env (backend root)
PORT=5000
DB_USER=system
DB_PASSWORD=yourpassword
DB_CONNECTION_STRING=localhost/xe
JWT_SECRET=supersecret123
EMAIL_USER=yourmail@gmail.com
EMAIL_PASS=yourgmailapppassword
```

> ⚠️ **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Generate for "Mail"

---

*Documentation covers: `server.js` · `db.js` · `routes.js` · `db_setup.sql` · `frontend/src/App.jsx` + all pages & components*
