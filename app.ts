import createError, { HttpError } from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
const app = express();
import proxyRoutes from './routes/proxy.js';
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js';
import cors from 'cors';
import { csrfGuard, issueCsrf } from './middleware/csrf.js';
import { ALLOWED } from './config/vars.js';

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (ALLOWED.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.get('/api/auth/csrf', issueCsrf);
app.use('/api', csrfGuard);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/', proxyRoutes);

// 404 error handler
app.use((req, res, next) => next(createError(404)));

// error handler
app.use((err: HttpError, req: Request, res: Response, _next: NextFunction) => {
  // Prints the full error stack to your terminal running Node/Express
  console.error(err);

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development'
      ? { message: err.message, stack: err.stack }
      : {},
  });
});

export default app;
