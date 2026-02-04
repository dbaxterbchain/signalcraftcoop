import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ?? buildDatabaseUrlFromEnv();
    if (!connectionString) {
      throw new Error('Missing database configuration');
    }
    const ssl = buildSslOptions();
    const pool = new Pool({ connectionString, ssl });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}

function buildDatabaseUrlFromEnv() {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ?? '5432';
  const name = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const sslMode = process.env.DB_SSLMODE;
  const caPath = process.env.DB_SSL_CA_PATH ?? process.env.PGSSLROOTCERT;

  if (!host || !name || !user || !password) {
    return undefined;
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const params = new URLSearchParams({ schema: 'public' });
  if (sslMode) {
    params.set('sslmode', sslMode);
  }
  if (caPath) {
    params.set('sslrootcert', caPath);
  }

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${name}?${params.toString()}`;
}

function buildSslOptions() {
  const sslMode = process.env.DB_SSLMODE;
  if (
    sslMode !== 'require' &&
    sslMode !== 'verify-ca' &&
    sslMode !== 'verify-full'
  ) {
    return undefined;
  }

  const rejectUnauthorizedEnv = process.env.DB_SSL_REJECT_UNAUTHORIZED;
  const rejectUnauthorized = rejectUnauthorizedEnv !== 'false';
  const caPath = process.env.DB_SSL_CA_PATH ?? process.env.PGSSLROOTCERT;
  const ssl: { rejectUnauthorized: boolean; ca?: string } = {
    rejectUnauthorized,
  };

  if (caPath && fs.existsSync(caPath)) {
    ssl.ca = fs.readFileSync(caPath, 'utf8');
  } else if (rejectUnauthorized) {
    console.warn(
      `[prisma] SSL CA bundle not found at ${caPath ?? 'unset'}; ` +
        'TLS verification may fail. Provide DB_SSL_CA_PATH or PGSSLROOTCERT.',
    );
  }

  return ssl;
}
