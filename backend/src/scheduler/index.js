import cron from 'node-cron';
import { pollLive } from './pollLive.js';
import { pollExtended } from './pollExtended.js';
import { calcDailyPeak } from './calcDailyPeak.js';
import { pruneSnapshots } from './prune.js';
import { pollNews } from './pollNews.js';
import { refreshWatchlist } from './refreshWatchlist.js';
import { trackJob, setNextRun } from '../utils/jobTracker.js';
import logger from '../utils/logger.js';

function nextCronRun(cronExpr, tz) {
  // Simple next-run estimator — returns ISO string
  try {
    const interval = cron.validate(cronExpr) ? null : null;
    // node-cron doesn't expose next-run; return null and let the tracker update on each run
    return null;
  } catch {
    return null;
  }
}

export function registerJobs() {
  const trackedPollLive = trackJob('pollLive', pollLive);
  const trackedPollExtended = trackJob('pollExtended', pollExtended);
  const trackedCalcDailyPeak = trackJob('calcDailyPeak', calcDailyPeak);
  const trackedPruneSnapshots = trackJob('pruneSnapshots', pruneSnapshots);
  const trackedPollNews = trackJob('pollNews', pollNews);
  const trackedRefreshWatchlist = trackJob('refreshWatchlist', refreshWatchlist);

  // Poll Steam top 100 every 60 minutes at :00
  cron.schedule('0 * * * *', async () => {
    await trackedPollLive();
  });

  // Poll extended game list (all DB games outside top 100) at :30
  cron.schedule('30 * * * *', async () => {
    await trackedPollExtended();
  });

  // Safety-net daily peak aggregation at 23:55 UTC
  cron.schedule('55 23 * * *', async () => {
    await trackedCalcDailyPeak();
  }, { timezone: 'UTC' });

  // Prune old snapshots at 01:00 UTC
  cron.schedule('0 1 * * *', async () => {
    await trackedPruneSnapshots();
  }, { timezone: 'UTC' });

  // Scrape gaming news RSS feeds daily at 09:00 America/New_York
  cron.schedule('0 9 * * *', async () => {
    await trackedPollNews().catch((err) =>
      logger.error('[pollNews] cron failed:', err.message),
    );
  }, { timezone: 'America/New_York' });

  // Refresh wishlist tracking table daily at 06:00 UTC
  cron.schedule('0 6 * * *', async () => {
    await trackedRefreshWatchlist().catch((err) =>
      logger.error('[refreshWatchlist] cron failed:', err.message),
    );
  }, { timezone: 'UTC' });

  logger.info('[scheduler] jobs registered (live: :00, extended: :30, peak: 23:55, prune: 01:00, news: 09:00 EST, watchlist: 06:00 UTC)');
}
