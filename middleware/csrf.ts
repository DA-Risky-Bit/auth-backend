import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { ALLOWED, CSRF_SECRET } from '../config/vars.js';


const sign = (v: string) =>
  crypto.createHmac('sha256', CSRF_SECRET).update(v).digest('hex');

export const issueCsrf = (_req: Request, res: Response) => {
  const raw = crypto.randomBytes(32).toString('hex');
  const token = `${raw}.${sign(raw)}`;
  res.json({ token });
};


export const csrfGuard = (req: Request, res: Response, next: NextFunction) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const origin = req.get('origin');
  if (origin && !ALLOWED.has(origin)) {
    return res.status(403).json({ message: 'Bad origin: ' + origin });
  }

  // Only require the header token
  const token = req.get('x-csrf-token') ?? req.body?._csrf;
  if (!token) {
    return res.status(403).json({ message: 'Missing X-CSRF-Token header' });
  }

  // Verify the cryptographic signature of the token itself
  const [raw, mac] = token.split('.');
  const expected = raw ? sign(raw) : '';

  if (!mac || mac.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) {
    return res.status(403).json({ message: 'Invalid CSRF signature' });
  }

  next();
};
