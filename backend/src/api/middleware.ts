// Middleware (T053) - basic error handler & validation helper placeholder
import { Request, Response, NextFunction } from 'express';

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error('API Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
}

// Example validation helper (not yet wired to zod schemas)
export function requireFields(body: any, fields: string[]): string | null {
  for (const f of fields) {
    if (!(f in body)) return `Missing field: ${f}`;
  }
  return null;
}