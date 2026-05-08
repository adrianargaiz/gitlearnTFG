import { app } from './app';
import { environment } from './config/environment';
import { connectDatabase, registerDatabaseLifecycleHandlers } from './database/mongoose';

async function bootstrap(): Promise<void> {
  try {
    registerDatabaseLifecycleHandlers();
    await connectDatabase();

    app.listen(environment.port, () => {
      console.log(`✓ Server running on port ${environment.port} [${environment.nodeEnv}]`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

void bootstrap();
