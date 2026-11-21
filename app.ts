import createError, { HttpError } from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
const app = express();
import proxyRoutes from './routes/proxy';
import authRoutes from './routes/auth'
import userRoutes from './routes/user';

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', proxyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);


// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
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
