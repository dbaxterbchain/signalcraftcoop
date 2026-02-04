# Dev Environment Setup

This is the recommended setup for local development.

## Prereqs
- Node.js (LTS)
- Docker Desktop

## 1) Start Postgres with Docker

From the repo root:

```bash
docker compose up -d
```

Defaults (see `docker-compose.yml`):
- user: `user`
- password: `password`
- db: `signalcraft`
- port: `5432`

These defaults match the example `DATABASE_URL` in `api/.env`.

## 2) Configure API env

Copy the example env and update values:

```bash
cd api
cp .env.example .env
```

Ensure `DATABASE_URL` matches the Docker settings:

```
DATABASE_URL=postgresql://user:password@localhost:5432/signalcraft?schema=public
```

## 3) Install deps + run migrations

```bash
cd api
npm install
npm run prisma -- generate
npm run prisma -- migrate dev
```

## 4) Start the API

```bash
cd api
npm run start:dev
```

## 5) Start the frontend

```bash
cd web
npm install
npm run dev
```

## 6) Configure Cognito Hosted UI (frontend)

Update `web/.env` with your Cognito values:

```
VITE_COGNITO_DOMAIN=https://your-domain.auth.us-west-2.amazoncognito.com
VITE_COGNITO_CLIENT_ID=your_client_id
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_COGNITO_LOGOUT_URI=http://localhost:5173/
```

Update `api/.env` with your Cognito domain + web origin:

```
COGNITO_DOMAIN=https://your-domain.auth.us-west-2.amazoncognito.com
COGNITO_LOGOUT_URI=http://localhost:5173/
WEB_ORIGIN=http://localhost:5173
```

In the Cognito App Client settings, add:
- Allowed callback URLs: `http://localhost:5173/auth/callback`
- Allowed sign-out URLs: `http://localhost:5173/`
- OAuth flow: Authorization code grant
- Scopes: `openid`, `email`, `profile`

If you enable Google as an IdP:
- Add Google redirect URI: `https://<your-cognito-domain>/oauth2/idpresponse`
- In the Cognito Google IdP settings, enter scopes space-delimited: `openid email profile`

## Troubleshooting

- Port 5432 busy: set `POSTGRES_PORT` in your shell and update `DATABASE_URL` accordingly.
- Docker container logs:
  ```bash
  docker logs signalcraft-postgres
  ```
