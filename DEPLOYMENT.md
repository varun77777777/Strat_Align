# Production Deployment Manual

This guide describes how to run and deploy Strat-Align in production environments.

---

## 🐳 Docker Deployment (Recommended)

The stack is fully containerized. You can run all services using Docker Compose:

### 1. Build and Run Stack
Run the following build command:
```bash
make deploy
```
This spins up four unified containers:
- `mongodb` (port 27017) — Database engine.
- `backend` (port 5000) — Express API server.
- `ai-service` (port 8000) — Python FastAPI worker.
- `frontend` (port 3000) — Nginx container serving static files.

### 2. Shut Down Stack
```bash
docker-compose down
```

---

## ☁️ Static Cloud Hosting (Vercel / Netlify)

The React client compiles to plain CSS, JS, and HTML.

### Frontend build output
Compile frontend files:
```bash
cd frontend
npm run build
```
Upload the compiled `/dist` directory to your hosting provider (Vercel, Netlify, AWS S3, etc.).
A template [vercel.json](file:///c:/Users/SHIVALEELA/Downloads/start%201/vercel.json) is provided in the project root to handle SPA router rewrites.
