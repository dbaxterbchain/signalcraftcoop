# Project Progress

Last updated: 2026-02-04

## Current status
- Core web + API scaffolding in place with Cognito Hosted UI auth.
- Cookie-based BFF flow implemented (`/auth/exchange`, `/auth/me`, `/auth/logout`).
- Prisma + Postgres setup with Docker compose for local dev.
- Initial UX system + landing page wireframes and theme docs.
- Staging infra deployed for VPC/RDS/Cognito/ECS+ALB; API container running.
- Staging API DNS wired in Route53; HTTPS listener + ACM in progress.
- Staging web deployed (S3 + CloudFront + ACM + Route53).
- Staging web deploy script added (`npm run deploy:staging`), with MIME type fixes for JS/CSS.
- Added staging web env file (`web/.env.staging`) and staging CI deploy workflow.
- GitHub Actions OIDC role created for staging deploys (branch: `staging`).
- Prod GitHub Actions OIDC role + manual deploy workflow added.
- Staging products API 500 traced to Prisma TLS validation (RDS CA bundle required).
- Added staging migration runbook (ECS one-off task) to ensure Prisma migrations are applied.
- Prisma CLI now supports DB_* envs in `prisma.config.ts` and includes schema in the API image.
- Staging DB connection now targets TLS verification via CA bundle (`DB_SSLMODE=verify-full` + `DB_SSL_CA_PATH`).

## Completed
- React + MUI web app with landing, products, custom order, orders, and order detail pages.
- Auth gate for protected pages + user menu with Orders + logout.
- Nest API with orders, products, design review endpoints and DTOs.
- Prisma schema + migrations + Prisma adapter-pg wiring.
- Local dev setup docs + Docker compose for Postgres.
- OAuth setup for Cognito Hosted UI and Google IdP (callback + sign-out URLs).
- CDK scaffolding in infra/ with staging VPC, RDS, Cognito, and API (ECS/ALB/ECR).
- Staging RDS credentials in Secrets Manager, injected into ECS tasks.
- Staging API Docker image build/push flow documented.

## In progress
- Orders/design review workflow wiring to real data and uploads.
- Finalizing auth UX and error handling.
- HTTPS for staging API complete (ACM + ALB listener + Route53 records).
- Web hosting stack (S3 + CloudFront) + DNS for `staging.app` complete.

## Next milestones
1) Payments
   - Stripe checkout + webhooks
   - Order payment status updates
2) File uploads
   - S3 bucket + pre-signed URLs
   - Design proof uploads + previews
3) Hosting
   - Complete staging TLS + web hosting
   - Repeat infra for prod
4) Admin operations
   - Order status management
   - Design upload + review cycle
5) Production readiness
   - CI/CD pipeline
   - Secrets management
   - Logging/monitoring

## Suggested next tasks
- Build the Stripe payment flow end-to-end (checkout + webhook + order update).
- Add S3 upload flow for design proofs (API + frontend upload UI).
- Add an Account page and polish the authenticated navigation.
- Add API integration tests for auth, orders, and design review.

## Notes / lessons learned
- ECS tasks fail with `CannotPullContainerError` until the image is pushed to ECR.
- Nest build output is `dist/src/main.js`; Dockerfile and `start:prod` must match.
- ALB HTTPS targets on port 3000 require explicit protocol (HTTP).
- Route53 ALIAS for ALB uses the ALB canonical hosted zone ID (from `describe-load-balancers`).
- Avoid manual DNS records if CDK will manage them; delete manual A/AAAA before CDK deploy.
- Cognito + Google IdP: redirect URI must be `https://<cognito-domain>/oauth2/idpresponse` and scopes are space-delimited (`openid email profile`).
- CDK deployments with security changes need approval or `--require-approval never` for non-interactive runs.
- Staging web deploy: S3 bucket `staging-staging-web-webbucket12880f5b-qqnt6ea0jfcd`, CloudFront `E1WNT7EZ9TRQSG` (invalidate after upload).
- If CloudFront serves JS as `text/plain`, re-upload assets with explicit `Content-Type`.
- RDS TLS requires the AWS CA bundle; bake `api/certs/rds-ca.pem` into the image and enable strict SSL.
