import http from 'http';
import debugLib from 'debug';
import app from '../app.js';
import { wsProxies } from '../routes/proxy.js';

import * as cookie from "cookie";
import jwt from 'jsonwebtoken';

import { ALLOWED, JWT_SECRET } from '../config/vars.js';


const debug = debugLib('auth-backend:server');

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT ?? '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

server.on('error', onError);
server.on('listening', onListening);


server.on('upgrade', (req, socket, head) => {
  const reject = () => { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); socket.destroy(); };

  if (!ALLOWED.has(req.headers.origin ?? '')) return reject();

  try {
    const cookies = cookie.parseCookie(req.headers.cookie ?? '');
    const session = cookies?.session;

    if (!session || typeof session !== 'string') {
      throw new Error('Unauthorized: Missing session token');
    }

    const user = jwt.verify(session, JWT_SECRET, { algorithms: ['HS256'] }) as any;
    (req as any).user = { id: user.id, email: user.email, role: user.role };
  } catch { return reject(); }

  const match = wsProxies.find(p => req.url?.startsWith(p.mount));
  if (!match) return socket.destroy();
  (match.proxy as any).upgrade(req, socket, head);
});

/**
 * Initialize database migrations and start the server.
 */
async function startServer() {
  try {
    server.listen(port);
  } catch (error) {
    console.error('Failed to start server due to migration error:', error);
    process.exit(1);
  }
}

startServer();

/**
 * Normalize a port into a number or string (named pipe).
 */
function normalizePort(val: string): string | number {
  const parsed = parseInt(val, 10);

  if (isNaN(parsed)) {
    // named pipe
    return val;
  }

  if (parsed >= 0) {
    // port number
    return parsed;
  }

  throw new Error(`Invalid port: ${val}`);
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
    // eslint-disable-next-line no-fallthrough
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
    // eslint-disable-next-line no-fallthrough
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
  debug(`Listening on ${bind}`);
}
