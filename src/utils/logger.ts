/**
 * Logger Utility
 * Wraps console methods to prevent spam in production
 */

const isProduction = process.env.NODE_ENV === 'production';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
    private prefix: string;

    constructor(prefix: string = '') {
        this.prefix = prefix ? `[${prefix}] ` : '';
    }

    private formatUrl(url: string | undefined): string {
        return url ? url : '';
    }

    debug(...args: any[]) {
        if (!isProduction) {
            console.debug(this.prefix, ...args);
        }
    }

    log(...args: any[]) {
        if (!isProduction) {
            console.log(this.prefix, ...args);
        }
    }

    info(...args: any[]) {
        if (!isProduction) {
            console.info(this.prefix, ...args);
        }
    }

    warn(...args: any[]) {
        // Always show warnings
        console.warn(this.prefix, ...args);
    }

    error(...args: any[]) {
        // Always show errors
        console.error(this.prefix, ...args);
    }
}

// Default logger instance
export const logger = new Logger();

// Factory for named loggers (e.g. const castLogger = createLogger('Cast'))
export const createLogger = (name: string) => new Logger(name);
