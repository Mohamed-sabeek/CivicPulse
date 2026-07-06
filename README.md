CivicPulse 🌍
Smart Civic Issue Reporting & Management System

A modern, production-ready MERN Stack web application that empowers citizens to report civic issues while enabling authorities to manage and resolve them efficiently through a centralized digital platform.

📖 Overview

CivicPulse is a full-stack web application developed to bridge the communication gap between citizens and local authorities. The platform provides a centralized system where users can report public issues such as potholes, garbage accumulation, water leakage, drainage problems, streetlight failures, and infrastructure damage.

Traditional complaint systems are often slow, lack transparency, and provide no proper tracking mechanism. CivicPulse addresses these challenges by offering real-time complaint tracking, secure authentication, role-based access control, and an intuitive user experience.

The project demonstrates the practical implementation of full-stack web development using the MERN Stack while promoting digital governance and smart city initiatives.

✨ Features
👤 Citizen Portal
User Registration & Login
Secure JWT Authentication
Report Civic Issues
Upload Issue Images
Add Location Details
Track Complaint Status
View Complaint History
Responsive Dashboard
🛠️ Admin Portal
Secure Admin Login
Dashboard Analytics
View All Complaints
Update Complaint Status
Mark Complaints as:
Open
In Progress
Resolved
Delete Invalid Complaints
Monitor Platform Statistics
📊 Dashboard Analytics
Total Users
Total Complaints
Open Issues
In Progress Issues
Resolved Issues
🔐 Security Features
JWT Authentication
Password Hashing
Protected Routes
Role-Based Authorization
Secure REST APIs
Input Validation
🎨 User Experience
Modern Responsive UI
Mobile Friendly
Fast Navigation
Clean Dashboard
Optimized Performance
Intuitive Complaint Workflow
🏗️ System Architecture
                User
                  │
                  ▼
          React Frontend
                  │
          REST API (Axios)
                  │
                  ▼
      Node.js + Express.js
                  │
          Mongoose ODM
                  │
                  ▼
             MongoDB
🚀 Technology Stack
Frontend
React 19
Vite
Tailwind CSS
React Router DOM
Axios
Lucide React
Backend
Node.js
Express.js
JWT Authentication
bcryptjs
Mongoose
Multer (Image Upload)
CORS
Database
MongoDB
MongoDB Atlas
Development Tools
Git
GitHub
Postman
VS Code
📂 Project Structure
CivicPulse
│
├── client
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── layouts
│   │   ├── hooks
│   │   ├── services
│   │   ├── assets
│   │   └── App.jsx
│   │
│   └── package.json
│
├── server
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── config
│   ├── uploads
│   ├── utils
│   └── server.js
│
├── README.md
└── package.json
🔄 Application Workflow
User creates an account.
User logs into the system.
User reports a civic issue.
Complaint is stored in MongoDB.
Admin reviews the complaint.
Admin updates the complaint status.
User tracks the complaint until it is resolved.
📦 Core Modules
User Module
Registration
Login
Profile
Complaint History
Complaint Module
Report Issue
Upload Image
View Status
Track Resolution
Admin Module
Dashboard
Complaint Management
User Management
Analytics
🗄️ Database Collections
Users
- user_id
- name
- email
- password
- phone
Complaints
- complaint_id
- user_id
- title
- description
- category
- location
- image
- status
- createdAt
Admin
- admin_id
- name
- email
- password
🔐 Authentication Flow
Register
      │
      ▼
Login
      │
      ▼
JWT Token Generated
      │
      ▼
Protected Routes
      │
      ▼
Authorized Access
📊 Dashboard Features

The Admin Dashboard provides:

Total Registered Users
Total Complaints
Open Complaints
In Progress Complaints
Resolved Complaints
🌍 Sustainable Development Goals
SDG 9 – Industry, Innovation and Infrastructure
SDG 11 – Sustainable Cities and Communities
SDG 16 – Peace, Justice and Strong Institutions
🚀 Technology Readiness Level

TRL 6

Technology Demonstration in a Relevant Environment

⚡ Performance Optimizations
Optimized MongoDB Queries
Mongoose .lean() Queries
React Lazy Loading
Code Splitting
API Optimization
Image Compression
Indexed Database Fields
Pagination
Memoized Components
Production Build Optimization
📈 Future Enhancements
AI-Based Issue Classification
Geo-Location Detection
Interactive Maps Integration
Push Notifications
Mobile Application
Government Department Integration
Email & SMS Notifications
Analytics Dashboard
Chatbot Support
Multi-Language Support
📚 Learning Outcomes

Through this project, we gained experience in:

MERN Stack Development
REST API Development
Authentication & Authorization
MongoDB Database Design
Frontend-Backend Integration
State Management
Performance Optimization
Responsive UI Development
Full-Stack Deployment
💡 Advantages
Centralized Complaint System
Faster Issue Resolution
Transparent Tracking
Secure Authentication
Responsive Design
Scalable Architecture
Improved Citizen Engagement
Efficient Administrative Management

🖥️ Installation
Clone Repository
git clone https://github.com/yourusername/CivicPulse.git
Install Frontend
cd client
npm install
Install Backend
cd server
npm install
Environment Variables

Create a .env file inside the server folder:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
Run Backend
npm run dev
Run Frontend
npm run dev

🤝 Contributing

Contributions, feature suggestions, and bug reports are welcome. Feel free to fork the repository, create a feature branch, and submit a pull request.

📄 License

This project is licensed under the MIT License.

👨‍💻 Developed By

Sabee
B.Tech Information Technology

⭐ If you found this project useful, consider giving it a Star on GitHub!
