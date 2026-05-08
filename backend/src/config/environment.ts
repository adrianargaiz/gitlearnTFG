import 'dotenv/config';

export const environment = {
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: process.env['PORT'] ?? 3000,
  mongodbUri: process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/gitlearn',
  frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:4200',
  jwtSecret: process.env['JWT_SECRET'],
  jwtExpiry: process.env['JWT_EXPIRY'] ?? '24h',
  github: {
    clientId: process.env['GITHUB_CLIENT_ID'],
    clientSecret: process.env['GITHUB_CLIENT_SECRET'],
    callbackUrl: process.env['GITHUB_CALLBACK_URL'],
  },
} as const;
