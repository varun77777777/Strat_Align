# Development Workflow Guide

Follow this guide to run, test, and contribute to Strat-Align.

---

## 🛠️ Local Development

### 1. Repository Layout
- `/frontend`: React client files.
- `/backend`: Express API and Mongoose database model schemas.
- `/ai-service`: Python FastAPI and scikit-learn models.
- `/scripts`: Shell startup and deployment commands.

### 2. Manual Services Installation
If you need to install packages in each service manually:

#### React Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Node.js Backend
```bash
cd backend
npm install
npm start
```

#### Python AI Service
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

### 3. Database Seeding
To force-reseed your database with the clean baseline dataset:
```bash
make seed
```
This drops the existing collections and seeds 8 realistic teams with declining or stable alignment histories.

---

## 🧪 Testing Interventions
- When running the React frontend, click on any team row in the matrix to open the detailed modal.
- You can paste a sample strategy OKR (e.g. "We must migrate our legacy platform to cloud by Q4") and team chat logs inside the evaluation box to observe live drift telemetry update in real-time.
- Click "Apply Interventions" in the sidebar to simulate mark-as-applied expected score increases.
