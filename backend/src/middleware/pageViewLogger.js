import crypto from 'crypto';
import pool from '../db/pool.js';
import logger from '../utils/logger.js';

const STATIC_EXT = /\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|map|ttf|eot|gif|webp)$/i;
const BOT_UA = /googlebot|bingbot|crawler|spider|bot|preview|slurp|yandex|baidu|duckduckbot|facebot|ia_archiver|semrush/i;

// Daily salt rotated at midnight UTC
let dailySalt = crypto.randomBytes(16).toString('hex');
let saltDate = new Date().toISOString().slice(0, 10);

function getDailySalt() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== saltDate) {
    dailySalt = crypto.randomBytes(16).toString('hex');
    saltDate = today;
  }
  return dailySalt;
}

function hashIp(ip) {
  return crypto
    .createHash('sha256')
    .update(ip + getDailySalt())
    .digest('hex');
}

export function pageViewLogger(req, res, next) {
  next(); // never block the response

  const path = req.path;

  // Skip paths we don't want to log
  if (
    path.startsWith('/api/') ||
    path.startsWith('/admin') ||
    path === '/sitemap.xml' ||
    path === '/robots.txt' ||
    path === '/health' ||
    STATIC_EXT.test(path)
  ) {
    return;
  }

  setImmediate(() => {
    const ua = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    const ipHash = hashIp(ip);
    const isBot = BOT_UA.test(ua);

    pool
      .query(
        `INSERT INTO page_views (path, referrer, user_agent, ip_hash, is_bot)
         VALUES ($1, $2, $3, $4, $5)`,
        [path, referrer, ua || null, ipHash, isBot],
      )
      .catch((err) => logger.error('[pageViewLogger]', err.message));
  });
}
