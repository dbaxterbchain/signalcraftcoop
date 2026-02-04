import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL ?? buildDatabaseUrlFromEnv();
if (!databaseUrl) {
  throw new Error('Missing database configuration for Prisma CLI');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: 'prisma/migrations',
  },
});

function buildDatabaseUrlFromEnv() {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ?? '5432';
  const name = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const sslMode = process.env.DB_SSLMODE;

  if (!host || !name || !user || !password) {
    return undefined;
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const params = new URLSearchParams({ schema: 'public' });
  if (sslMode) {
    params.set('sslmode', sslMode);
  }

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${name}?${params.toString()}`;
}
