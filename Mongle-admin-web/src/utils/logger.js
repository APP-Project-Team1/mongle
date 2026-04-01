export const logger = {
  log: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[LOG]', ...args);
    }
  },

  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },
};