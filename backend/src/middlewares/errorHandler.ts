import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler: ErrorRequestHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;
  const isProduction = process.env['NODE_ENV'] === 'production';

  console.error(`[${new Date().toISOString()}] ${statusCode} — ${err.message}`);

  res.status(statusCode).json({
    message: err.isOperational
      ? err.message
      : isProduction
        ? 'Error interno del servidor.'
        : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
