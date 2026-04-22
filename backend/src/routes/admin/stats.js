import { Router } from 'express';
import pool from '../../db/pool.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getRecentErrors } from '../../utils/errorBuffer.js';
import { getAllJobStats } from '../../utils/jobTracker.js';

const router = Router();
const startedAt = Date.now();

// GET /api/admin/stats/traffic?range=24h|7d|30d
router.get('/traffic', asyncHandler(async (req, res) => {
  const range = req.query.range || '24h';
  let interval, groupBy, groupLabel;

  switch (range) {
    case '7d':
      interval = '7 days';
      groupBy = "date_trunc('day', created_at)";
      groupLabel = 'day';
      break;
    case '30d':
      interval = '30 days';
      groupBy = "date_trunc('day', created_at)";
      groupLabel = 'day';
      break;
    default:
      interval = '24 hours';
      groupBy = "date_trunc('hour', created_at)";
      groupLabel = 'hour';
  }

  const since = `NOW() - INTERVAL '${interval}'`;

  const [totals, topPaths, topReferrers, overTime] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int                                          AS "totalViews",
        COUNT(DISTINCT ip_hash)::int                           AS "uniqueVisitors",
        COUNT(*) FILTER (WHERE NOT is_bot)::int                AS "humanViews",
        COUNT(*) FILTER (WHERE is_bot)::int                    AS "botViews"
      FROM page_views
      WHERE created_at >= ${since}
    `),
    pool.query(`
      SELECT path, COUNT(*)::int AS views
      FROM page_views
      WHERE created_at >= ${since} AND NOT is_bot
      GROUP BY path ORDER BY views DESC LIMIT 20
    `),
    pool.query(`
      SELECT referrer, COUNT(*)::int AS views
      FROM page_views
      WHERE created_at >= ${since} AND referrer IS NOT NULL AND NOT is_bot
      GROUP BY referrer ORDER BY views DESC LIMIT 20
    `),
    pool.query(`
      SELECT ${groupBy} AS bucket, COUNT(*)::int AS views
      FROM page_views
      WHERE created_at >= ${since}
      GROUP BY bucket ORDER BY bucket
    `),
  ]);

  res.json({
    ...totals.rows[0],
    topPaths: topPaths.rows,
    topReferrers: topReferrers.rows,
    viewsOverTime: overTime.rows.map((r) => ({
      [groupLabel]: r.bucket,
      views: r.views,
    })),
  });
}));

// GET /api/admin/stats/games
router.get('/games', asyncHandler(async (_req, res) => {
  const [totalGames, topGames, recentErrors, lastCall] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM games'),
    pool.query(`
      SELECT l.appid, g.name, l.current_ccu AS "currentPlayers"
      FROM leaderboard_cache l
      JOIN games g ON g.appid = l.appid
      ORDER BY l.current_ccu DESC
      LIMIT 10
    `),
    pool.query(`
      SELECT COUNT(*)::int AS count FROM page_views WHERE FALSE
    `), // placeholder — Steam API errors tracked in-memory
    pool.query(`
      SELECT last_updated_at FROM leaderboard_cache ORDER BY last_updated_at DESC LIMIT 1
    `),
  ]);

  res.json({
    totalGamesTracked: totalGames.rows[0].count,
    topGamesByCurrentPlayers: topGames.rows,
    recentSteamApiErrors: 0, // tracked outside DB
    lastSteamApiCallAt: lastCall.rows[0]?.last_updated_at || null,
  });
}));

// GET /api/admin/stats/health
router.get('/health', asyncHandler(async (_req, res) => {
  let dbConnected = false;
  let dbLatencyMs = 0;

  const dbStart = Date.now();
  try {
    await pool.query('SELECT 1');
    dbConnected = true;
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbLatencyMs = Date.now() - dbStart;
  }

  const mem = process.memoryUsage();

  res.json({
    dbConnected,
    dbLatencyMs,
    backendUptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    memoryMb: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    },
    nodeVersion: process.version,
    lastErrors: getRecentErrors(10),
  });
}));

// GET /api/admin/stats/jobs
router.get('/jobs', asyncHandler(async (_req, res) => {
  res.json({ jobs: getAllJobStats() });
}));

export default router;
