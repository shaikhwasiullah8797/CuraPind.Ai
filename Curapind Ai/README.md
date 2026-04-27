# CuraPind AI

A predictive healthcare triage system designed for rural India. This is a full-stack MVP featuring a React setup with Glassmorphism UI and a Node.js/Express backend applying a mock Random Forest AI prediction logic.

## Prerequisites

Node.js is currently **not** installed on your system. To build and run this application, please follow these steps:

1. **Install Node.js:** Download and install Node.js from the [official website](https://nodejs.org/). This will install both `node` and `npm`.
2. **Install MongoDB:** Download and install [MongoDB Community Edition](https://www.mongodb.com/try/download/community), or use a cloud database like MongoDB Atlas.

## Environment Variables Guide

### Backend Configuration
Create a `.env` file in the `backend` directory based on the `backend/.env.example` file:
```env
MONGO_URI=mongodb://localhost:27017/curapindai
JWT_SECRET=supersecretjwtkey123
PORT=5000
```
*(Ensure your MongoDB service is running locally on port 27017, or replace with your Atlas URI).*

## Setup Instructions

### 1. Backend Setup

```bash
cd "Curapind Ai\backend"
npm install
npm start
```
The backend server will run on `http://localhost:5000`.

### 2. Frontend Setup

Open a new terminal.
```bash
cd "Curapind Ai\frontend"
npm install
npm run dev
```
The React frontend (Vite) will run on `http://localhost:5173`.

## Sample Dataset for Testing Predictions

When you run the app and start a Health Check, try the following inputs to verify the 3 risk tiers:

### Low Risk Scenario
*   **Age:** 35
*   **Duration:** 1-3 days
*   **Temp:** 98.6 °F
*   **Heart Rate:** 72 bpm
*   **SpO2:** 98%
*   **Symptoms:** Cough

### Moderate Risk Scenario
*   **Age:** 68
*   **Duration:** 4-7 days
*   **Temp:** 101.5 °F
*   **Heart Rate:** 105 bpm
*   **SpO2:** 92%
*   **Symptoms:** Fever, Cough

### Critical Risk Scenario
*   **Age:** 75
*   **Duration:** More than a week
*   **Temp:** 104.0 °F
*   **Heart Rate:** 130 bpm
*   **SpO2:** 88%
*   **Symptoms:** Breathlessness, Chest Pain
