# Signalcraft Coop API

NestJS API for orders, designs, and account workflows.

## Setup

```bash
npm install
```

## Local database (Docker)

From the repo root:

```bash
docker compose up -d
```

Default Postgres settings are in `docker-compose.yml` and match the example `DATABASE_URL`.

## Environment

Copy the example file and fill in your Cognito values:

```bash
cp .env.example .env
```

Required variables:
- `COGNITO_REGION`
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`
- `COGNITO_DOMAIN`
- `COGNITO_LOGOUT_URI`
- `WEB_ORIGIN`
- `COGNITO_IDENTITY_POOL_ID` (optional for future AWS credential flows)
- `COGNITO_IDENTITY_POOL_REGION` (optional, if different from user pool region)
- `DATABASE_URL`

Optional:
- `AWS_REGION` (fallback if `COGNITO_REGION` is not set)
- `PORT`

## Prisma

This API includes Prisma for Postgres persistence. When ready:

```bash
npm run prisma -- generate
npm run prisma -- migrate dev
```

Prisma uses `prisma.config.ts` to read `DATABASE_URL` for migrations.

## Run

```bash
npm run start:dev
```
