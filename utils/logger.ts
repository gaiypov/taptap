// Simple cross-platform logger for the app (React Native/Expo)
// - info/debug are silenced in production, error/warn always shown

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class AppLogger {
  private formatMessage(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`;
  }

  info(message: string, context?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: any): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: any): void {
    // eslint-disable-next-line no-console
    console.error(this.formatMessage('error', message, context));
  }

  debug(message: string, context?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug?.(this.formatMessage('debug', message, context));
    }
  }
}

export const appLogger = new AppLogger();
export default appLogger;


