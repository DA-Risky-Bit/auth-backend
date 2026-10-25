import express from 'express';
import cors from 'cors';
import type { Socket } from 'net';
import { createProxyMiddleware } from 'http-proxy-middleware';

// DEV ONLY: no auth, no tokens. Just routes /api/<name>/* to each backend.
const services = {
  docker:      { url: 'http://localhost:3001', prefix: '/api/docker' },
  leaderboard: { url: 'http://localhost:3002', prefix: '/api/leaderboard' },
  chat:        { url: 'http://localhost:3003', prefix: '/api/chat', ws: true },
} satisfies Record<string, { url: string; prefix: string; ws?: boolean }>;

var router = express.Router();
router.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173', credentials: true }));

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
