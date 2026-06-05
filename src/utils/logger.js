/**
 * Conditional Logger Utility
 * Only logs in development mode to prevent exposing sensitive data in production
 */

const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;
const isClientLoggingEnabled = isDevelopment || import.meta.env.VITE_ENABLE_CLIENT_LOGS === 'true';

class Logger {
  constructor(context = '') {
    this.context = context;
  }

  _formatMessage(message) {
    return this.context ? `[${this.context}] ${message}` : message;
  }

  debug(...args) {
    if (isClientLoggingEnabled) {
      console.log(this._formatMessage(args[0]), ...args.slice(1));
    }
  }

  info(...args) {
    if (isClientLoggingEnabled) {
      console.info(this._formatMessage(args[0]), ...args.slice(1));
    }
  }

  warn(...args) {
    if (isClientLoggingEnabled) {
      console.warn(this._formatMessage(args[0]), ...args.slice(1));
    }
  }

  error(...args) {
    if (isClientLoggingEnabled) {
      console.error(this._formatMessage(args[0]), ...args.slice(1));
    }
  }

  group(label) {
    if (isClientLoggingEnabled && console.group) {
      console.group(label);
    }
  }

  groupEnd() {
    if (isClientLoggingEnabled && console.groupEnd) {
      console.groupEnd();
    }
  }

  table(data) {
    if (isClientLoggingEnabled && console.table) {
      console.table(data);
    }
  }
}

// Create logger instances for different parts of the app
export const logger = new Logger();
export const apiLogger = new Logger('API');
export const authLogger = new Logger('Auth');
export const supabaseLogger = new Logger('Supabase');

export default logger;
