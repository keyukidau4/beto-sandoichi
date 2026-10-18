import morgan from 'morgan';
import { Request, Response } from 'express';
import { morganStream } from '../utils/logger';

// Custom token for user ID
morgan.token('user-id', (req: Request) => {
  return (req as any).user?.id || 'anonymous';
});

// Custom token for request body (sanitized)
morgan.token('body', (req: Request) => {
  const body = { ...req.body };
  
  // Remove sensitive fields
  if (body.password) body.password = '[REDACTED]';
  if (body.token) body.token = '[REDACTED]';
  if (body.email && req.path.includes('login')) body.email = '[REDACTED]';
  
  return JSON.stringify(body);
});

// Custom token for response time in different colors
morgan.token('colored-response-time', function (req: Request, res: Response) {
  const start = process.hrtime(); // high-resolution start time

  // We need to return a function that runs when the response finishes.
  const end = res.once('finish', () => {
    const diff = process.hrtime(start);
    const responseTime = diff[0] * 1e3 + diff[1] / 1e6; // in ms

    let colored;
    if (responseTime > 1000) {
      colored = `\x1b[31m${responseTime.toFixed(2)}ms\x1b[0m`; // red
    } else if (responseTime > 500) {
      colored = `\x1b[33m${responseTime.toFixed(2)}ms\x1b[0m`; // yellow
    } else {
      colored = `\x1b[32m${responseTime.toFixed(2)}ms\x1b[0m`; // green
    }

    // Store in res.locals so we can access it later in the token
    res.locals.coloredResponseTime = colored;
  });

  // Return placeholder string now — actual value is logged later
  return ':local-response-time';
});

morgan.token('local-response-time', function (_req, res: Response) {
  return res.locals.coloredResponseTime || '';
});

// Development format with colors
const developmentFormat = ':method :url :status :colored-response-time - :user-id';

// Production format with more details
const productionFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time ms',
  userAgent: ':user-agent',
  userId: ':user-id',
  ip: ':remote-addr',
  timestamp: ':date[iso]',
  body: ':body'
});

// Skip logging for health checks and static files
const skip = (req: Request, res: Response) => {
  return req.url === '/health' || 
         req.url.startsWith('/static') ||
         req.url.includes('favicon.ico');
};

// Export middleware based on environment
export const requestLogger = process.env.NODE_ENV === 'production'
  ? morgan(productionFormat, { stream: morganStream, skip })
  : morgan(developmentFormat, { stream: morganStream, skip });