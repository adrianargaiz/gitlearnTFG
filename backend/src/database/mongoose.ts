import mongoose from 'mongoose';
import { environment } from '../config/environment';

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(environment.mongodbUri);
  console.log('✓ MongoDB connected:', environment.mongodbUri);
}

export function registerDatabaseLifecycleHandlers(): void {
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠ MongoDB disconnected');
  });

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
}
