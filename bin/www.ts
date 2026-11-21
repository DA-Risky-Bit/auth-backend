/**
 * Module dependencies.
 */

import http from 'http';
import debugLib from 'debug';
import app from '../app';
import { migrate } from '../config/migrate';
import { wsProxies } from '../routes/proxy';
import { Socket } from 'node:net';

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
  const match = wsProxies.find(({ mount }) => req.url?.startsWith(mount));
  if (match) match.proxy.upgrade?.(req, socket as Socket, head);
  else socket.destroy();
});

/**
 * Initialize database migrations and start the server.
 */
async function startServer() {
  try {
    console.log('Running database migrations...');
    await migrate();
    console.log('Migrations completed successfully.');

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
