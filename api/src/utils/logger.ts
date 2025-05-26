import pino from 'pino';
import dotenv from 'dotenv';
dotenv.config();

let dir = process.env.LOG_FILES_PATH || "./";
const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
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
        destination: dir+"/log.log",
        mkdir: true
      }
    },
});

export default logger;