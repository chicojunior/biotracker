/**
 * Process entry point: load env, open the pool, build the app, listen.
 * Run in dev with `npm run dev:api` (tsx --env-file=api/.env).
 */
import { buildApp } from './app';
import { createDb } from './db/client';
import { loadEnv } from './env';

async function main(): Promise<void> {
  const env = loadEnv();
  const { db, pool } = createDb(env.databaseUrl);
  const app = await buildApp({ db, weekStartsOn: env.weekStartsOn, logger: true });

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Received ${signal}, shutting down`);
    await app.close();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    await pool.end();
    process.exit(1);
  }
}

void main();
