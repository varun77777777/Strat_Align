// server.js — Main Express application entry point
'use strict';

// ── Environment ───────────────────────────────────────────────────────────────
require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const morgan      = require('morgan');
const mongoose    = require('mongoose');
const rateLimit   = require('express-rate-limit');

// ── Routes ────────────────────────────────────────────────────────────────────
const teamsRouter           = require('./routes/teams');
const predictionsRouter     = require('./routes/predictions');
const recommendationsRouter = require('./routes/recommendations');

// ── Seed ──────────────────────────────────────────────────────────────────────
const { seed } = require('./seed');

// ── Config ────────────────────────────────────────────────────────────────────
const PORT         = parseInt(process.env.PORT || '5000', 10);
const MONGODB_URI  = process.env.MONGODB_URI  || 'mongodb://localhost:27017/strat_align';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max:      parseInt(process.env.RATE_LIMIT_MAX       || '100',   10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

// ── Middleware ────────────────────────────────────────────────────────────────

// CORS — allow frontend origin + OPTIONS pre-flight
app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ],
  methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:   ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials:      true,
  optionsSuccessStatus: 200,
}));

// Request parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Request logging (compact in production, verbose in dev)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting on all /api routes
app.use('/api', limiter);

// Attach DB status to every request for downstream use
app.use((req, _res, next) => {
  req.dbReady = mongoose.connection.readyState === 1;
  next();
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  const status  = dbState === 1 ? 'ok' : 'degraded';
  const httpCode = dbState === 1 ? 200  : 503;

  return res.status(httpCode).json({
    status,
    timestamp:   new Date().toISOString(),
    service:     'strat-align-backend',
    version:     '1.0.0',
    database:    dbStateMap[dbState] ?? 'unknown',
    uptime:      Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/teams',           teamsRouter);
app.use('/api/predictions',     predictionsRouter);
app.use('/api/recommendations', recommendationsRouter);

// Convenience alias — POST /api/analyze maps to recommendations router
app.post('/api/analyze', (req, res, next) => {
  req.url = '/analyze';
  recommendationsRouter(req, res, next);
});

// GET /api/alignment-history maps to predictions router
app.get('/api/alignment-history', (req, res, next) => {
  req.url = '/alignment-history';
  predictionsRouter(req, res, next);
});

// ── Root ──────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name:    'Strat-Align API',
    version: '1.0.0',
    docs:    '/health',
    endpoints: [
      'GET  /health',
      'GET  /api/teams',
      'GET  /api/teams/:id',
      'GET  /api/predictions',
      'GET  /api/recommendations',
      'GET  /api/alignment-history',
      'POST /api/analyze',
      'POST /api/recommendations/:id/apply',
    ],
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error:   `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);

  // Mongoose validation error → 400
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error:   'Validation error',
      details: Object.values(err.errors).map(e => e.message),
    });
  }

  // Mongoose CastError (bad ObjectId) → 400
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error:   `Invalid value for field '${err.path}': ${err.value}`,
    });
  }

  // Duplicate key → 409
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error:   'Duplicate entry — resource already exists',
    });
  }

  // DB not connected → 503
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error:   'Database unavailable — please try again shortly',
    });
  }

  // Everything else → 500
  const isDev = process.env.NODE_ENV !== 'production';
  return res.status(500).json({
    success: false,
    error:   err.message || 'Internal server error',
    ...(isDev ? { stack: err.stack } : {}),
  });
});

// ── Database Connection + Server Start ───────────────────────────────────────

/** Try to start an in-memory MongoDB server as a fallback */
async function tryInMemoryMongo () {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri    = mongod.getUri();
    console.log('[db] 🧪 Using in-memory MongoDB (no real MongoDB detected)');
    return { mongod, uri };
  } catch {
    return null;
  }
}

async function startServer () {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       Strat-Align API Server v1.0        ║');
  console.log('╚══════════════════════════════════════════╝');

  let inMemoryInstance = null;

  // 1️⃣ Try the configured/real MongoDB first (1 fast attempt)
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS:          10000,
    });
    console.log(`[db] ✓ Connected to MongoDB: ${MONGODB_URI}`);
  } catch (realErr) {
    console.warn(`[db] Real MongoDB unavailable: ${realErr.message}`);
    console.log('[db] Attempting in-memory MongoDB fallback…');

    // 2️⃣ Fall back to mongodb-memory-server
    inMemoryInstance = await tryInMemoryMongo();
    if (inMemoryInstance) {
      try {
        await mongoose.connect(inMemoryInstance.uri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log('[db] ✓ Connected to in-memory MongoDB');
      } catch (memErr) {
        console.error('[db] In-memory MongoDB also failed:', memErr.message);
        console.error('[db] Starting in fully degraded mode (no database)');
      }
    } else {
      console.error('[db] mongodb-memory-server not available. Starting in degraded mode.');
      console.error('[db] Install MongoDB or run: npm install mongodb-memory-server --save-dev');
    }
  }

  // Event listeners
  mongoose.connection.on('error',      err  => console.error('[db] Error:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('[db] Disconnected'));
  mongoose.connection.on('reconnected', () => console.log('[db] Reconnected'));

  // Auto-seed if DB is connected and empty
  if (mongoose.connection.readyState === 1) {
    try {
      await seed();
    } catch (err) {
      console.error('[seed] Failed:', err.message);
    }
  }

  // Start HTTP server
  const server = app.listen(PORT, () => {
    console.log(`[server] ✓ Listening on http://localhost:${PORT}`);
    console.log(`[server]   Health → http://localhost:${PORT}/health`);
    console.log(`[server]   CORS   → ${FRONTEND_URL}`);
    console.log(`[server]   Env    → ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received — shutting down gracefully…`);
    server.close(async () => {
      await mongoose.disconnect();
      if (inMemoryInstance?.mongod) {
        await inMemoryInstance.mongod.stop();
        console.log('[db] In-memory MongoDB stopped');
      }
      console.log('[server] Bye ✓');
      process.exit(0);
    });

    // Force exit after 10 s
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException',  err => { console.error('[uncaughtException]', err);  });
  process.on('unhandledRejection', err => { console.error('[unhandledRejection]', err); });
}

startServer();
