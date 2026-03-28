# 🚀 MemeHub — Full Stack Meme Platform

A fully-featured Full Stack web application designed for sharing, collecting, and discussing memes. It includes a secure JWT authentication system, multi-format meme uploads (image/video/text), and a solid Oracle Database backend.

---

## 📖 Documentation Reference

The primary documentation is divided into the Frontend and Backend specs:

- 🔙 [**Backend Architecture & API Docs**](./backend.readme.md)  
  *(Includes DFD Diagrams, API Routes, ERD schemas, and AWS Deployment Guide)*
- 🎨 [**Frontend & React Docs**](./frontend/README.md)  
  *(Includes React UI details, Vite instructions, and Component layout)*

---

## ✨ Core Features

- **Secure Verification:** Email OTP verification needed during signup before account activation.
- **Oracle Database Engine:** Robust persistence with `oracledb` connection pooling.
- **Rich Media Uploads:** Built-in Multer support for uploading Image and Video files safely up to 50MB.
- **Instant Metrics:** Correlated SQL queries fetch accurate like and comment counts in real-time.
- **Role Enforcement:** Users only have access to modify/delete their own memes.

---

## 🛠️ Quick Start Guide

### 1. Database Initialization
1. Ensure an Oracle Database (XE or ATP) is running.
2. Execute the DDL script found in `db_setup.sql` in your Oracle SQL client to provision the tables.

### 2. Backend Setup
```bash
# Install dependencies
npm install

# Copy the environment file template
cp .env.example .env
# Important: Open .env and fill in your Oracle DB and Gmail App Password

# Start the Node.js backend server (Default: http://localhost:5000)
npm run dev
```

### 3. Frontend Setup
```bash
# Open a new terminal session
cd frontend

# Install dependencies
npm install

# Start the React Vite development server
npm run dev
```

---

## 🧱 Tech Stack

| Component | Tech Used |
|-----------|-----------|
| **Frontend** | React 18, Vite, React Router DOM, Vanilla CSS |
| **Backend** | Node.js, Express.js (ESM), Multer, Nodemailer, JSONWebToken |
| **Database** | Oracle Database (XE) |

## 📝 License
This project is open-source and available under the MIT License.
