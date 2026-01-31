# Signalcraft Coop API

NestJS API for orders, designs, and account workflows.

## Setup

```bash
npm install
```

## Environment

Copy the example file and fill in your Cognito values:

```bash
cp .env.example .env
```

Required variables:
- `COGNITO_REGION`
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`
- `COGNITO_IDENTITY_POOL_ID` (optional for future AWS credential flows)
 - `COGNITO_IDENTITY_POOL_REGION` (optional, if different from user pool region)

Optional:
- `AWS_REGION` (fallback if `COGNITO_REGION` is not set)
- `PORT`

## Run

```bash
npm run start:dev
```
