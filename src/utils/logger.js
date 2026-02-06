/**
 * Conditional Logger Utility
 * Only logs in development mode to prevent exposing sensitive data in production
 */

const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;

class Logger {
  constructor(context = '') {
    this.context = context;
  }

  _formatMessage(message) {
    return this.context ? `[${this.context}] ${message}` : message;
  }

  debug(...args) {
    if (isDevelopment) {
      console.log(this._formatMessage(args[0]), ...args.slice(1));
    }
  }

  info(...args) {
    if (isDevelopment) {
      console.info(this._formatMessage(args[0]), ...args.slice(1));
    }
  }

  warn(...args) {
    if (isDevelopment) {
      console.warn(this._formatMessage(args[0]), ...args.slice(1));
    }
  }

  error(...args) {
    // Errors are logged in both dev and production, but sanitized in production
    if (isDevelopment) {
      console.error(this._formatMessage(args[0]), ...args.slice(1));
    } else {
      // In production, only log the error message, not full details
      console.error(this._formatMessage(args[0]));
    }
  }

  group(label) {
    if (isDevelopment && console.group) {
      console.group(label);
    }
  }

  groupEnd() {
    if (isDevelopment && console.groupEnd) {
      console.groupEnd();
    }
  }

  table(data) {
    if (isDevelopment && console.table) {
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
