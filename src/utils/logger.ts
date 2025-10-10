/**
 * Simple logging utility that can be easily extended to use a proper logging library
 * like winston or pino in the future.
 */

enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG',
}

function formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
}

export const logger = {
    error(message: string, ...args: any[]): void {
        console.error(formatMessage(LogLevel.ERROR, message), ...args);
    },

    warn(message: string, ...args: any[]): void {
        console.warn(formatMessage(LogLevel.WARN, message), ...args);
    },

    info(message: string, ...args: any[]): void {
        console.log(formatMessage(LogLevel.INFO, message), ...args);
    },

    debug(message: string, ...args: any[]): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(formatMessage(LogLevel.DEBUG, message), ...args);
        }
    },
};

