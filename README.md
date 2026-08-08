# Strat-Align — Strategic Execution Drift Detector

Strat-Align is a full-stack dashboard designed to monitor team strategic execution alignment, predict failure risks, identify concept drifts using sentiment analysis, and generate actionable organizational interventions.

---

## 🏗️ Architecture

```
                 ┌─────────────────────────────┐
                 │    React Frontend Client    │
                 │         (Port 5173)         │
                 └──────────────┬──────────────┘
                                │ API calls
                                ▼
                 ┌─────────────────────────────┐
                 │     Express Backend API     │
                 │         (Port 5000)         │
                 └──────────────┬──────────────┘
                                │
                      ┌─────────┴─────────┐
                      ▼                   ▼
             ┌─────────────────┐ ┌─────────────────┐
             │  MongoDB Server │ │ Python AI Svc   │
             │  (Port 27017)   │ │  (Port 8000)    │
             └─────────────────┘ └─────────────────┘
```

- **Frontend**: React + Vite styled with a glassmorphism dark theme.
- **Backend**: Express + Mongoose with node-cache optimization and in-memory fallback database.
- **AI Microservice**: FastAPI + scikit-learn + Gemini/HuggingFace API calls.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (v3.13+)
- Docker Desktop (optional, for production deployment)

### 1. Set Up Environment Variables
Copy `.env.example` at the root directory to create the configurations:
```bash
cp .env.example .env
```
Ensure you have configured your environment keys if you want to use the live HuggingFace and Gemini models (otherwise, the system gracefully falls back to deterministic rule-based models).

### 2. Launch Services
You can run all three services concurrently using the startup command:

**On Windows:**
Simply double-click [start-all.bat](start-all.bat) inside the root directory.

**On Linux / macOS:**
```bash
make dev
```

The app will start at:
- **Web App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **AI Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📚 Guides & Documentation
- [Development Workflow](DEVELOPMENT.md) — How to set up and run tests.
- [Deployment Manual](DEPLOYMENT.md) — How to deploy with Docker or Nginx.
- [API Spec](API.md) — Full REST endpoint descriptions.
