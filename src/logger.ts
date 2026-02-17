import {
  createLogger,
  type LoggerHelpers,
  type LoggerOptions,
} from '@cheatron/cheatron-log';

// Default configuration: console logging only, level 'info'
let loggerInstance = createLogger({
  level: 'info',
});

// Export the helpers directly for easy usage
export const logger = loggerInstance.helpers;

/**
 * Configure the global native logger
 */
export function configureLogger(options: LoggerOptions) {
  loggerInstance = createLogger(options);
}

// Better approach: Export a proxy object that forwards to the current logger instance
export const log: LoggerHelpers = {
  fatal: (c: string, m: string, d?: unknown) =>
    loggerInstance.helpers.fatal(`NativeMock/${c}`, m, d),
  error: (c: string, m: string, d?: unknown) =>
    loggerInstance.helpers.error(`NativeMock/${c}`, m, d),
  warn: (c: string, m: string, d?: unknown) =>
    loggerInstance.helpers.warn(`NativeMock/${c}`, m, d),
  info: (c: string, m: string, d?: unknown) =>
    loggerInstance.helpers.info(`NativeMock/${c}`, m, d),
  debug: (c: string, m: string, d?: unknown) =>
    loggerInstance.helpers.debug(`NativeMock/${c}`, m, d),
  trace: (c: string, m: string, d?: unknown) =>
    loggerInstance.helpers.trace(`NativeMock/${c}`, m, d),
  child: (c: string) => loggerInstance.helpers.child(`NativeMock/${c}`),
};
