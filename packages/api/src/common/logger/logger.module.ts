import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, trace }) => {
    const contextStr = context ? `[${context}]` : '';
    const traceStr = trace ? `\n${trace}` : '';
    return `${timestamp} ${level} ${contextStr} ${message}${traceStr}`;
  }),
);

@Module({
  imports: [
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
        }),
        // File transport for errors
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ],
      exceptionHandlers: [
        new winston.transports.File({
          filename: 'logs/exceptions.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: 'logs/rejections.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
