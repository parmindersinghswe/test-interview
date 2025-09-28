import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.accessToken',
      'req.body.refreshToken',
      'accessToken',
      'refreshToken',
      'token',
      '*.token',
      'userId',
      '*.userId',
      'user.id',
      '*.user.id'
    ],
    censor: '[REDACTED]'
  }
});

export default logger;
