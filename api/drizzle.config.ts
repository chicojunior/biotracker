import { defineConfig } from 'drizzle-kit';

// Load api/.env when present (dev); in prod DATABASE_URL comes from the
// environment. process.loadEnvFile is available on Node >= 20.12.
try {
  process.loadEnvFile(new URL('.env', import.meta.url));
} catch {
  // No .env file — rely on the ambient environment.
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run drizzle-kit (pass via --env-file or inline).');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl },
  // Keep generated names aligned with the v2 reference schema for traceability.
  breakpoints: true,
});
