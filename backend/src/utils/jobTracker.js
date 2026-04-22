/**
 * Minimal in-memory tracker for scheduler job runs.
 * Wraps each job function to record execution stats.
 */
const stats = new Map();

export function trackJob(name, fn) {
  if (!stats.has(name)) {
    stats.set(name, {
      name,
      lastRunAt: null,
      lastRunStatus: null,
      lastRunDurationMs: null,
      nextRunAt: null,
      errorCount24h: 0,
      errors24h: [],
    });
  }

  return async (...args) => {
    const entry = stats.get(name);
    const start = Date.now();
    try {
      await fn(...args);
      entry.lastRunAt = new Date().toISOString();
      entry.lastRunStatus = 'success';
      entry.lastRunDurationMs = Date.now() - start;
    } catch (err) {
      entry.lastRunAt = new Date().toISOString();
      entry.lastRunStatus = 'error';
      entry.lastRunDurationMs = Date.now() - start;
      entry.errorCount24h += 1;
      entry.errors24h.push(Date.now());
      throw err; // re-throw so existing error handlers still work
    }
  };
}

export function setNextRun(name, nextRunAt) {
  const entry = stats.get(name);
  if (entry) entry.nextRunAt = nextRunAt;
}

export function getAllJobStats() {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const result = [];

  for (const entry of stats.values()) {
    // prune errors older than 24h
    entry.errors24h = entry.errors24h.filter((ts) => ts > dayAgo);
    entry.errorCount24h = entry.errors24h.length;

    result.push({
      name: entry.name,
      lastRunAt: entry.lastRunAt,
      lastRunStatus: entry.lastRunStatus,
      lastRunDurationMs: entry.lastRunDurationMs,
      nextRunAt: entry.nextRunAt,
      errorCount24h: entry.errorCount24h,
    });
  }
  return result;
}
