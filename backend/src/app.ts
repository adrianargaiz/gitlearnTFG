import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import passport from 'passport';
import { configurePassport } from './config/passport';
import { corsOptions } from './config/cors';
import { globalRateLimiter } from './config/rateLimiters';
import { errorHandler } from './middlewares/errorHandler';
import { noCache } from './middlewares/noCache';
import { router } from './routes';

export const app: Application = express();

configurePassport();

app.use(passport.initialize());
app.use(helmet());
app.use(cors(corsOptions));
app.use(globalRateLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(noCache);

app.use('/api', router);
app.use(errorHandler);
