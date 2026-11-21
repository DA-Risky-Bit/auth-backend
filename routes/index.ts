import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

// DEV ONLY: no auth, no tokens. Just routes /api/<name>/* to each backend.
const services = {
  docker:      { url: 'http://docker-backend:3000', prefix: '/api/docker' },
  leaderboard: { url: 'http://leaderboard-backend:3000', prefix: '/api/leaderboard' },
  chat:        { url: 'http://chat-backend:3000', prefix: '/api/chat', ws: true },
} satisfies Record<string, { url: string; prefix: string; ws?: boolean }>;

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

const wsProxies: Array<{ mount: string; proxy: ReturnType<typeof createProxyMiddleware> }> = [];

for (const [name, svc] of Object.entries(services)) {
  const mount = `/api/${name}`;

  const proxy = createProxyMiddleware({
    target: svc.url,
    changeOrigin: true,
    ws: 'ws' in svc,
    proxyTimeout: 0, // keep SSE / WebSockets open
    timeout: 0,
    // Express strips the mount path for HTTP; WebSocket upgrades keep the full URL
    pathRewrite: (path) => svc.prefix + (path.startsWith(mount) ? path.slice(mount.length) : path),
  });

  router.use(mount, proxy);
  if ('ws' in svc) wsProxies.push({ mount, proxy });
}

export default router;
