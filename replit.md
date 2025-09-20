# Proctored Exam Application

## Overview
This is a real-time proctored examination system built with Node.js, Express, Socket.IO, and MongoDB. The application allows administrators to monitor candidates taking exams through live video feeds while candidates complete timed assessments.

## Recent Changes (Sept 20, 2025)
- ✅ Migrated from GitHub import to Replit environment
- ✅ Updated server to bind to port 5000 and host 0.0.0.0 for Replit compatibility
- ✅ Fixed directory structure (Public → public)
- ✅ Added fallback in-memory storage when MongoDB is not available
- ✅ Configured workflow for frontend server on port 5000
- ✅ All dependencies installed and server running successfully

## Project Architecture

### Backend
- **Server**: Node.js/Express server with Socket.IO for real-time communication
- **Database**: MongoDB (with in-memory fallback if not configured)
- **Port**: 5000 (configured for Replit environment)

### Frontend
- **Admin Dashboard** (`/admin.html`): Central hub for administrators
- **Proctoring Interface** (`/proctor.html`): Live video monitoring and candidate admission
- **Exam Interface** (`/exam.html`): Student exam taking interface with video streaming
- **Results Dashboard** (`/results.html`): View exam scores and submissions

### Key Features
- Real-time video proctoring using WebRTC
- Live candidate monitoring and admission control
- Timed multiple-choice questions
- Tab-switching detection and automatic termination
- Results storage and retrieval
- Socket.IO for real-time communication

## Configuration
- Server runs on port 5000 bound to 0.0.0.0
- Uses environment variable `MONGO_URI` for database connection
- Falls back to in-memory storage if MongoDB is not configured
- Static files served from `public/` directory

## Current Status
- ✅ Server is running and responding correctly
- ✅ All HTML pages are accessible
- ✅ Socket.IO integration is working
- ⚠️ Using in-memory storage (add MONGO_URI secret for persistence)
- ✅ Ready for deployment configuration