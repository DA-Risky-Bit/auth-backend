import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticateToken, requireAdmin } from '../middleware';

var router = express.Router();

const allowed = [
  'http://admin.localhost',
  'http://chat.localhost',
  'http://app.localhost',
  'http://localhost:5173',
];

router.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)),
  credentials: true,
}));

// Define services along with their specific auth requirements
const services = {
  docker: {
    url: 'http://docker-backend:3000',
    prefix: '/api/docker',
    middleware: [authenticateToken, requireAdmin] // Docker management needs admin auth
  },
  leaderboard: {
    url: 'http://leaderboard-backend:3000',
    prefix: '/api/leaderboard',
    middleware: [authenticateToken] // Any logged-in user can view leaderboard
  },
  chat: {
    url: 'http://chat-backend:3000',
    prefix: '/api/chat',
    ws: true,
    middleware: [authenticateToken] // Chat requires a valid token
  },
} satisfies Record<string, {
  url: string;
  prefix: string;
  ws?: boolean;
  middleware: Array<any>
}>;

const wsProxies: Array<{ mount: string; proxy: ReturnType<typeof createProxyMiddleware> }> = [];

for (const [name, svc] of Object.entries(services)) {
  const mount = `/api/${name}`;

  const proxy = createProxyMiddleware({
    target: svc.url,
    changeOrigin: true,
    ws: 'ws' in svc,
    proxyTimeout: 0, // keep SSE / WebSockets open
    timeout: 0,
    pathRewrite: (path) => svc.prefix + (path.startsWith(mount) ? path.slice(mount.length) : path),
  });

  // Mount the service with its declared middleware array executed first
  router.use(mount, ...svc.middleware, proxy);

  if ('ws' in svc) {
    wsProxies.push({ mount, proxy });
  }
}

export { wsProxies };
export default router;
