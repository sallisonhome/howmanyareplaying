/**
 * In-memory ring buffer storing the last N server errors.
 */
const MAX = 50;
const errors = [];

export function pushError(err) {
  errors.push({
    timestamp: new Date().toISOString(),
    message: typeof err === 'string' ? err : err?.message ?? String(err),
  });
  if (errors.length > MAX) errors.shift();
}

export function getRecentErrors(n = 10) {
  return errors.slice(-n);
}
