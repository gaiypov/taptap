// ============================================
// Logger Utility
// ============================================

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
  }

  info(message: string, context?: any): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: any): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: any): void {
    console.error(this.formatMessage('error', message, context));
  }

  debug(message: string, context?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  audit(
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId: string,
    details?: any
  ): void {
    this.info('AUDIT', {
      userId,
      action,
      resourceType,
      resourceId,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

export const logger = new Logger();
export default logger;

