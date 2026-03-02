import { Router } from 'express';
import pool from '../db/pool.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Hourly pattern — average CCU by hour of day over last 30 days
router.get('/:appid/hourly', asyncHandler(async (req, res) => {
  const appid = parseInt(req.params.appid, 10);
  if (isNaN(appid)) {
    return res.status(400).json({ error: 'Invalid appid' });
  }

  const { rows } = await pool.query(
    `SELECT
       EXTRACT(HOUR FROM captured_at AT TIME ZONE 'UTC')::integer AS hour,
       ROUND(AVG(ccu))::integer AS avg_ccu
     FROM ccu_snapshots
     WHERE appid = $1
       AND captured_at >= NOW() - INTERVAL '30 days'
     GROUP BY 1
     ORDER BY 1 ASC`,
    [appid],
  );

  res.json({ appid, data: rows });
}));

// Rank history — daily rank snapshots
router.get('/:appid/rank', asyncHandler(async (req, res) => {
  const appid = parseInt(req.params.appid, 10);
  if (isNaN(appid)) {
    return res.status(400).json({ error: 'Invalid appid' });
  }

  const range = req.query.range ?? '3m';

  let rows;
  if (range === '3m') {
    ({ rows } = await pool.query(
      `SELECT rank, recorded_date AS time FROM rank_history
       WHERE appid = $1 AND recorded_date >= CURRENT_DATE - INTERVAL '90 days'
       ORDER BY recorded_date ASC`,
      [appid],
    ));
  } else if (range === '6m') {
    ({ rows } = await pool.query(
      `SELECT rank, recorded_date AS time FROM rank_history
       WHERE appid = $1 AND recorded_date >= CURRENT_DATE - INTERVAL '180 days'
       ORDER BY recorded_date ASC`,
      [appid],
    ));
  } else if (range === '1y') {
    ({ rows } = await pool.query(
      `SELECT rank, recorded_date AS time FROM rank_history
       WHERE appid = $1 AND recorded_date >= CURRENT_DATE - INTERVAL '365 days'
       ORDER BY recorded_date ASC`,
      [appid],
    ));
  } else if (range === 'all') {
    ({ rows } = await pool.query(
      `SELECT rank, recorded_date AS time FROM rank_history
       WHERE appid = $1
       ORDER BY recorded_date ASC`,
      [appid],
    ));
  } else {
    return res.status(400).json({ error: 'range must be 3m, 6m, 1y, or all' });
  }

  res.json({ appid, range, data: rows });
}));

// CCU history — snapshots or daily peaks depending on range
router.get('/:appid', asyncHandler(async (req, res) => {
  const appid = parseInt(req.params.appid, 10);
  if (isNaN(appid)) {
    return res.status(400).json({ error: 'Invalid appid' });
  }

  const range = req.query.range ?? 'day';

  // All-time peak with the date it occurred
  const { rows: peakRows } = await pool.query(
    `SELECT peak_ccu AS all_time_peak, peak_date AS all_time_peak_date
     FROM daily_peaks WHERE appid = $1
     ORDER BY peak_ccu DESC LIMIT 1`,
    [appid],
  );
  const all_time_peak      = peakRows[0]?.all_time_peak      ?? null;
  const all_time_peak_date = peakRows[0]?.all_time_peak_date ?? null;

  let rows;

  if (range === 'day') {
    ({ rows } = await pool.query(
      `SELECT ccu, captured_at AS time
       FROM ccu_snapshots
       WHERE appid = $1
         AND captured_at >= NOW() - INTERVAL '24 hours'
       ORDER BY captured_at ASC`,
      [appid],
    ));
  } else if (range === 'week') {
    ({ rows } = await pool.query(
      `SELECT peak_ccu AS ccu, peak_date AS time
       FROM daily_peaks
       WHERE appid = $1
         AND peak_date > CURRENT_DATE - INTERVAL '7 days'
       ORDER BY peak_date ASC`,
      [appid],
    ));
  } else if (range === 'month') {
    ({ rows } = await pool.query(
      `SELECT peak_ccu AS ccu, peak_date AS time
       FROM daily_peaks
       WHERE appid = $1
         AND peak_date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY peak_date ASC`,
      [appid],
    ));
  } else if (range === '3m') {
    ({ rows } = await pool.query(
      `SELECT peak_ccu AS ccu, peak_date AS time
       FROM daily_peaks
       WHERE appid = $1
         AND peak_date >= CURRENT_DATE - INTERVAL '90 days'
       ORDER BY peak_date ASC`,
      [appid],
    ));
  } else if (range === '6m') {
    ({ rows } = await pool.query(
      `SELECT peak_ccu AS ccu, peak_date AS time
       FROM daily_peaks
       WHERE appid = $1
         AND peak_date >= CURRENT_DATE - INTERVAL '180 days'
       ORDER BY peak_date ASC`,
      [appid],
    ));
  } else if (range === '1y') {
    ({ rows } = await pool.query(
      `SELECT peak_ccu AS ccu, peak_date AS time
       FROM daily_peaks
       WHERE appid = $1
         AND peak_date >= CURRENT_DATE - INTERVAL '365 days'
       ORDER BY peak_date ASC`,
      [appid],
    ));
  } else if (range === 'all') {
    ({ rows } = await pool.query(
      `SELECT peak_ccu AS ccu, peak_date AS time
       FROM daily_peaks
       WHERE appid = $1
       ORDER BY peak_date ASC`,
      [appid],
    ));
  } else {
    return res.status(400).json({ error: 'range must be day, week, month, 3m, 6m, 1y, or all' });
  }

  res.json({ appid, range, data: rows, all_time_peak, all_time_peak_date });
}));

export default router;
