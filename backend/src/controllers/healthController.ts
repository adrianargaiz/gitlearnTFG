import { Request, Response } from 'express';
import { environment } from '../config/environment';

export function healthCheck(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: environment.nodeEnv,
  });
}
