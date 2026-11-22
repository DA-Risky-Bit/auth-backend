// JWT Secret for User <-> Server
export const JWT_SECRET: string = process.env.JWT_SECRET ?? '';
if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');

// CSRF Secret for User <-> Server
export const CSRF_SECRET: string = process.env.CSRF_SECRET ?? '';
if (!CSRF_SECRET) throw new Error('CSRF_SECRET is not set');

// JWT Secret for Server <-> Proxied Backends
export const INTERNAL_SECRET: string = process.env.INTERNAL_SECRET ?? '';
if (!INTERNAL_SECRET) throw new Error('INTERNAL_SECRET is not set');

// Cookie valid time (milliseconds)
export const SESSION_MS: number = 24 * 60 * 60 * 1000;

// Allowed Origins
const defaultOrigins: string[] = ['https://app.riskybit.at', 'https://admin.riskybit.at', 'https://chat.riskybit.at'];
const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : defaultOrigins;

export const ALLOWED: Set<string> = new Set(allowedOrigins);
