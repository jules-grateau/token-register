import pino from 'pino';
import dotenv from 'dotenv';
dotenv.config();

export function createLogger(env: NodeJS.ProcessEnv = process.env) {
  const dir = env.LOG_FILES_PATH || './';
  const isDevelopment = env.NODE_ENV !== 'production';

  return pino({
    level: env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : {
          target: 'pino/file',
          options: {
            destination: dir + '/log.log',
            mkdir: true,
          },
        },
  });
}

const logger = createLogger();
export default logger;
