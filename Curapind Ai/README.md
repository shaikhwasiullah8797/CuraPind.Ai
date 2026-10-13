# CuraPind AI (क्योरपिंड एआई)

> **Predictive Rural Healthcare Triage & Optical PPG Vitals System for Primary Care & ASHA Health Workers**

CuraPind AI is a smart digital healthcare triage assistant designed to empower rural health workers (ASHA/ANM) and individuals in remote areas. It provides immediate risk stratification, clinical action recommendations, and smartphone/webcam optical photoplethysmography (PPG) vitals scanning.

---

## Key Features

1. **Optical PPG Camera Vitals Scanner (Experimental):**
   - Captures fingertip pulse waves via camera stream.
   - Non-blocking camera initialization with watchdog timeout and graceful fallback.
   - Dual-mode sensor detection: Flash-illuminated capillary absorption (mobile) + ambient light occlusion (laptop/desktop webcam).
   - Instant "Auto-Fill Detected Vitals" fallback for non-camera or rapid screening use cases.

2. **Calibrated Random Forest Decision Engine:**
   - 3-tier risk classification: **Low Risk**, **Moderate Risk**, and **Critical Risk**.
   - Dual-engine resilience: Full Node.js/Express inference API + synchronized client-side fallback engine so predictions NEVER fail even in offline/remote field deployments.
   - Actionable rural healthcare recommendations (e.g., immediate ORS/IV fluid protocols, PHC referral, home care guidance).

3. **Modern Glassmorphic UI:**
   - Tailored high-contrast accessibility interface built with React, Vite, and Tailwind CSS.
   - One-Click Instant Demo Login as ASHA Health Worker or Patient.
   - Comprehensive Health History tracking with local storage caching and backend synchronization.

---

## Quickstart Guide

### 1. Backend Server Setup
```bash
cd "Curapind Ai/backend"
npm install
npm start
```
*The Node/Express backend will start on `http://localhost:5000`.*

### 2. Frontend Setup
```bash
cd "Curapind Ai/frontend"
npm install
npm run dev
```
*The Vite development server will run on `http://localhost:5173`.*

---

## Google Cloud Deployment Guide

CuraPind AI includes production configuration files ready for deployment on **Google Cloud Platform (GCP)**:

### Option A: Google Cloud Run (Recommended Containerized Deployment)
1. **Build and deploy via Google Cloud SDK / Console:**
   ```bash
   gcloud builds submit "Curapind Ai" --tag gcr.io/<YOUR_GCP_PROJECT_ID>/curapind-ai
   gcloud run deploy curapind-ai \
     --image gcr.io/<YOUR_GCP_PROJECT_ID>/curapind-ai \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8080
   ```
2. **Or deploy directly via Google Cloud Console:**
   - Go to [Google Cloud Run Console](https://console.cloud.google.com/run).
   - Click **Create Service**.
   - Select **Continuously deploy from a repository** and choose GitHub repository `shaikhwasiullah8797/CuraPind.Ai`.
   - Build Type: **Dockerfile** (located at `/Dockerfile`).
   - Click **Deploy**!

### Option B: Google App Engine
```bash
cd "Curapind Ai"
gcloud app deploy app.yaml
```

---

## Testing Triage Clinical Scenarios

| Scenario | Age | Duration | Temp (°F) | Heart Rate (bpm) | SpO2 (%) | Diarrhoea | Expected Risk Level |
|---|---|---|---|---|---|---|---|
| **Low Risk** | 32 | 1-3 days | 98.6 | 72 | 98 | None | **Low Risk** (Home care & self-monitoring) |
| **Moderate Risk** | 68 | 4-7 days | 101.5 | 108 | 93 | Moderate | **Moderate Risk** (PHC visit & ORS prescribed) |
| **Critical Risk** | 74 | >1 week | 103.8 | 132 | 88 | Severe | **Critical Risk** (Immediate hospital transfer) |

---

## License
MIT License.
