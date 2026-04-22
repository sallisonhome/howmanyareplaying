import { Router } from 'express';
import pool from '../db/pool.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const BASE = 'https://howmanyareplaying.com';

router.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT appid FROM games ORDER BY appid');

  const staticPages = [
    { loc: BASE,                 changefreq: 'daily',   priority: '1.0' },
    { loc: `${BASE}/compare`,   changefreq: 'weekly',  priority: '0.8' },
    { loc: `${BASE}/watchlist`, changefreq: 'weekly',  priority: '0.6' },
    { loc: `${BASE}/news`,     changefreq: 'daily',   priority: '0.8' },
  ];

  const gamePages = rows.map((r) => ({
    loc: `${BASE}/game/${r.appid}`,
    changefreq: 'daily',
    priority: '0.7',
  }));

  const allPages = [...staticPages, ...gamePages];

  const urlTags = allPages.map(
    ({ loc, changefreq, priority }) =>
      `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlTags.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
}));

export default router;
