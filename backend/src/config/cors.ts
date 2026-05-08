import { CorsOptions } from 'cors';
import { environment } from './environment';

export const corsOptions: CorsOptions = {
  origin: environment.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
