import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import apiRouter from './routes/index.js';
import adminRouter from './routes/admin/index.js';
import pool from './db/pool.js';
import { pageViewLogger } from './middleware/pageViewLogger.js';
import { pushError } from './utils/errorBuffer.js';
import logger from './utils/logger.js';

export function createApp() {
  const app = express();

  // Trust proxy so X-Forwarded-For and secure cookies work behind nginx
  app.set('trust proxy', 1);

  app.use(cors({
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: true,
  }));
  app.use(express.json());

  // Session middleware (used by admin auth)
  const PgSession = connectPgSimple(session);
  app.use(session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: false, // migration handles this
      pruneSessionInterval: 60 * 15, // prune expired sessions every 15 min
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // Page view logging (fire-and-forget, before routes)
  app.use(pageViewLogger);

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Prevent Cloudflare and other proxies from caching API responses
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  // Admin routes
  app.use('/api/admin', adminRouter);

  // API routes
  app.use(apiRouter);

  // 404 handler for unmatched API paths
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler
  app.use((err, _req, res, _next) => {
    logger.error('[app] unhandled error:', err.message);
    pushError(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
