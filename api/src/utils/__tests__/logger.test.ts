import logger, { createLogger } from '../logger';

describe('Logger', () => {
  it('should initialize logger', () => {
    expect(logger).toBeDefined();
  });

  it('should initialize logger with default level in development', () => {
    const devLogger = createLogger({ NODE_ENV: 'development' });
    expect(devLogger.level).toBe('debug');
  });

  it('should initialize logger with default level in production', () => {
    const prodLogger = createLogger({ NODE_ENV: 'production' });
    expect(prodLogger.level).toBe('info');
  });

  it('should use custom log level if provided', () => {
    const customLogger = createLogger({ LOG_LEVEL: 'silent' });
    expect(customLogger.level).toBe('silent');
  });
});
