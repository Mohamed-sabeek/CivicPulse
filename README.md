# 🏛️ CivicPulse — Citizen Issue Reporting & Governance Platform

**CivicPulse** is a modern, full-stack GovTech web application designed to bridge the communication gap between citizens and local administrative authorities. It empowers community members to report civic concerns (such as sanitation, potholes, water leakages, and broken streetlights), track resolution workflows in real-time, upvote priority issues, and receive in-app notifications throughout the issue lifecycle.

---

## 🚀 Key Features

### 👤 Citizen / Community Features
- **Intuitive Issue Reporting**: Report community issues with title, category, location, detailed description, and client-side compressed photo evidence.
- **Support & Upvotes**: Prioritize urgent community issues through a dynamic upvote system (*Highest Upvotes → Lowest Upvotes*).
- **Interactive Community Feed**: Explore reports with real-time category filtering, search, and sorting.
- **Success Stories / Resolved Feed**: Public archive of fixed community issues celebrating neighborhood improvements with exact resolution dates.
- **Citizen Notifications 🔔**: Real-time in-app notifications alerting citizens whenever the status of their reported issue changes (`Pending → In Progress → Resolved`).
- **Resolved Issue Protection**: Preserves historical votes and comments in a read-only state while locking new interactions once an issue is resolved.

### 🛡️ Admin & Municipal Governance
- **Admin Control Center**: Live operational dashboard displaying dynamic metrics: *Total Users, Total Issues, Pending Issues, In Progress, and Resolved Issues*.
- **Active Issues Pipeline**: Management table for open community concerns with custom status dropdowns and confirmation modals.
- **Complete Issue History & Audit Trail**: Central repository for all past and present civic issues with filtering, search, and resolution time analytics.
- **Interactive Status Timeline**: Visual audit log tracking who changed the issue status, timestamps, and administrative notes.
- **Admin Notifications 🔔**: Live alerts whenever citizens report new civic issues.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons, React Router DOM v7, Axios |
| **Backend** | Node.js, Express.js, JWT Authentication, bcryptjs, CORS, dotenv |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Code Quality** | ESLint |

---

## 🏗️ System Architecture

```text
                User / Citizen / Admin
                          │
                          ▼
                  React Frontend (Vite)
                          │
                  REST API (Axios + JWT)
                          │
                          ▼
                Node.js + Express.js
                          │
                     Mongoose ODM
                          │
                          ▼
                    MongoDB Atlas
```

---

## 📁 Project Structure

```text
civic-pulse/
├── client/                     # Frontend Application (React + Vite)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, NotificationBell, StatusDropdown, Timeline)
│   │   ├── constants/          # App constants & categories
│   │   ├── pages/              # Views (Landing, Login, Register, Dashboard, Admin, History, Resolved)
│   │   ├── utils/              # API instance, image compression utilities
│   │   ├── App.jsx             # Router & route definitions
│   │   └── main.jsx            # React root mount
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend API (Node.js + Express)
│   ├── config/                 # Database connection config
│   ├── middleware/             # Auth & Admin route guards
│   ├── models/                 # Mongoose schemas (User, Issue, IssueHistory, Notification)
│   ├── routes/                 # REST API endpoints (auth, issues, admin, notifications)
│   ├── server.js               # Express server entry point
│   ├── createAdmin.js          # Admin seed script
│   └── package.json
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation
```

---

## 🚦 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MongoDB Atlas** database connection URI

---

### 2. Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `server/.env`:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:5173
   ```
4. Seed default administrator (optional):
   ```bash
   node createAdmin.js
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```

---

### 3. Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---

## 📡 REST API Overview

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new citizen account
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/auth/user` — Get logged-in user profile

### 📋 Issues (`/api/issues`)
- `GET /api/issues` — Get community issues (supports pagination & sorting)
- `POST /api/issues` — Submit a new civic issue report
- `GET /api/issues/:id` — Get full issue details & comments
- `PUT /api/issues/:id/vote` — Upvote or remove upvote (locked when resolved)
- `POST /api/issues/:id/comment` — Add a discussion comment (locked when resolved)

### 🛡️ Admin Management (`/api/admin`)
- `GET /api/admin/stats` — Overall statistics summary
- `GET /api/admin/dashboard` — Live dashboard metrics & active pipeline
- `GET /api/admin/issues/history` — Complete issue repository
- `GET /api/admin/issues/:id/timeline` — Detailed audit timeline & resolution duration
- `PUT /api/admin/issues/:id/status` — Progress issue status (`Pending → In Progress → Resolved`)
- `DELETE /api/admin/issues/:id` — Permanently delete an issue and associated records

### 🔔 Notifications (`/api/notifications`)
- `GET /api/notifications` — Fetch user-specific notifications & unread count
- `PUT /api/notifications/:id/read` — Mark single notification as read
- `PUT /api/notifications/mark-all-read` — Mark all notifications as read

---

## 🔒 Security & Best Practices
- Passwords securely hashed with **bcryptjs** (salt rounds: 10).
- Stateless authorization using **JWT (JSON Web Tokens)**.
- Strict role-based middleware for citizen and administrative routes.
- Client-side image compression prevents payload overflows and optimizes network transfer.
- Automated linting configured with ESLint.

---

## 👨‍💻 Author & Maintainer
- **Mohamed Sabeek** — *B.Tech Information Technology*

---

## 📄 License
This project is licensed under the MIT License.
