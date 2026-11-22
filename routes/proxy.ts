import express, { Request, RequestHandler, Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { IncomingMessage, ClientRequest } from 'http';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { INTERNAL_SECRET } from '../config/vars.js';

interface UserPayload {
    id: number;
    email: string;
    role: number;
}

// Define the user shape attached to the request by authentication middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: number;
  };
  body: Record<string, any>;
}

// Generate an internal JWT for downstream microservices
const internalToken = (user: UserPayload, aud: string): string =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, INTERNAL_SECRET, {
    expiresIn: '30s',
    audience: aud,
    issuer: 'gateway',
  });

// Fix the proxied request body stream for parsed JSON/URL-encoded bodies
function fixRequestBody(proxyReq: ClientRequest, req: IncomingMessage): void {
  const expressReq = req as AuthenticatedRequest;

  if (!expressReq.body || !Object.keys(expressReq.body).length) {
    return;
  }

  const contentType = proxyReq.getHeader('content-type');
  let bodyData = JSON.stringify(expressReq.body);

  if (contentType === 'application/x-www-form-urlencoded') {
    bodyData = new URLSearchParams(expressReq.body).toString();
  }

  proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
}
const router: Router = express.Router();

// Define service configuration interface
interface ServiceConfig {
  url: string;
  prefix: string;
  ws?: boolean;
  middleware: RequestHandler[];
}

// Define services along with their specific auth requirements
const services = {
  docker: {
    url: 'http://docker-backend:3000',
    prefix: '/api/docker',
    middleware: [authenticateToken, requireAdmin],
  },
  leaderboard: {
    url: 'http://leaderboard-backend:3000',
    prefix: '/api/leaderboard',
    middleware: [authenticateToken],
  },
  chat: {
    url: 'http://chat-backend:3000',
    prefix: '/api/chat',
    ws: true,
    middleware: [authenticateToken],
  },
} satisfies Record<string, ServiceConfig>;

interface WsProxyEntry {
  mount: string;
  proxy: ReturnType<typeof createProxyMiddleware>;
}

const wsProxies: WsProxyEntry[] = [];

for (const [name, svc] of Object.entries(services)) {
  const mount = `/api/${name}`;

  const proxy = createProxyMiddleware({
    target: svc.url,
    changeOrigin: true,
    ws: 'ws' in svc,
    proxyTimeout: 0,
    timeout: 0,
    pathRewrite: (path: string) => svc.prefix + (path.startsWith(mount) ? path.slice(mount.length) : path),
    on: {
      proxyReq: (proxyReq: ClientRequest, req: IncomingMessage) => {
        proxyReq.removeHeader('cookie');
        proxyReq.removeHeader('authorization');
        proxyReq.removeHeader('x-internal-auth');

        const authReq = req as AuthenticatedRequest;
        if (authReq.user) {
          proxyReq.setHeader('x-internal-auth', internalToken(authReq.user, name));
        }
        fixRequestBody(proxyReq, req);
      },
      proxyReqWs: (proxyReq: ClientRequest, req: IncomingMessage) => {
        proxyReq.removeHeader('cookie');
        proxyReq.removeHeader('x-internal-auth');

        const authReq = req as AuthenticatedRequest;
        if (authReq.user) {
          proxyReq.setHeader('x-internal-auth', internalToken(authReq.user, name));
        }
      },
    },
  });

  // Mount the service with its declared middleware array executed first
  router.use(mount, ...svc.middleware, proxy);

  if ('ws' in svc) {
    wsProxies.push({ mount, proxy });
  }
}

export { wsProxies };
export default router;
