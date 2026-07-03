/**
 * Explicit environment loading (SPEC §I.env). Fails fast with the offending
 * variable name rather than surfacing an opaque connection error later.
 */

export type AppEnv = {
  databaseUrl: string;
  port: number;
  weekStartsOn: number;
};

function requireString(name: string): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseWeekStartsOn(raw: string | undefined): number {
  if (raw === undefined) {
    return 1;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
    throw new Error(`WEEK_STARTS_ON must be an integer 0..6, got: ${raw}`);
  }

  return parsed;
}

export function loadEnv(): AppEnv {
  return {
    databaseUrl: requireString('DATABASE_URL'),
    port: Number(process.env.PORT ?? 3001),
    weekStartsOn: parseWeekStartsOn(process.env.WEEK_STARTS_ON),
  };
}
