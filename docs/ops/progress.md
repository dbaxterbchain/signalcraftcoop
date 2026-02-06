# Project Progress

Last updated: 2026-02-06

## Current status
- Core web + API scaffolding in place with Cognito Hosted UI auth.
- Cookie-based BFF flow implemented (`/auth/exchange`, `/auth/me`, `/auth/logout`).
- Prisma + Postgres setup with Docker compose for local dev.
- Initial UX system + landing page wireframes and theme docs.
- Staging infra deployed for VPC/RDS/Cognito; API running on Lambda HTTP API.
- Staging web deployed (S3 + CloudFront + ACM + Route53).
- Staging web deploy script added (`npm run deploy:staging`), with MIME type fixes for JS/CSS.
- Added staging web env file (`web/.env.staging`) and staging CI deploy workflow.
- GitHub Actions OIDC role created for staging deploys (branch: `staging`).
- Prod infra deployed for VPC/RDS/Cognito and web hosting.
- Prod API now via Lambda HTTP API with custom domain.
- Prod web live at `https://app.signalcraftcoop.com`.
- Added prod web env file (`web/.env.production`) and prod deploy workflow defaults.
- Prod deploy workflow includes Prisma migrate via migration Lambda.
- Cognito prod callback/logout URLs now prod-only (localhost removed).
- Prisma CLI supports DB_* envs in `prisma.config.ts` and includes schema in the API image.
- DB connections now target TLS verification via CA bundle (`DB_SSLMODE=verify-full` + `DB_SSL_CA_PATH`).
- Cost reductions: prod NAT gateways reduced to 1; old ECS logs retain 7 days; ECR lifecycle keeps last 5 (staging) / 10 (prod) images.
- Staging Lambda HTTP API verified (`/products` returns `[]`) and staging web now points to the Lambda custom domain.
- Staging web redeployed after Lambda cutover (2026-02-05).
- Legacy ECS API stacks removed (staging + prod); ALBs/ACM for API deleted.
- API Gateway custom domains created:
  - Staging: `https://staging.api.signalcraftcoop.com`
  - Prod: `https://api.signalcraftcoop.com`
- Migration Lambda added and wired into CI for staging + prod.
- GitHub Actions OIDC roles updated for CDK bootstrap access (SSM + assets bucket + PassRole).

## Completed
- React + MUI web app with landing, products, custom order, orders, and order detail pages.
- Auth gate for protected pages + user menu with Orders + logout.
- Nest API with orders, products, design review endpoints and DTOs.
- Prisma schema + migrations + Prisma adapter-pg wiring.
- Local dev setup docs + Docker compose for Postgres.
- OAuth setup for Cognito Hosted UI and Google IdP (callback + sign-out URLs).
- CDK scaffolding in infra/ with staging + prod VPC, RDS, Cognito, and API (Lambda HTTP API).
- RDS credentials in Secrets Manager, injected into Lambda env.
- API Docker image build/push flow documented (staging + prod).
- Prod web hosting deployed (S3 + CloudFront + Route53).

## In progress
- Orders/design review workflow wiring to real data and uploads.
- Finalizing auth UX and error handling.
- CI/CD hardening (prod deploy workflow permissions + docs).
- Infra cleanup: replace deprecated CDK constructs (`DnsValidatedCertificate` -> `Certificate`, `S3Origin` -> `S3BucketOrigin`).

## Next milestones
1) Payments
   - Stripe checkout + webhooks
   - Order payment status updates
2) File uploads
   - S3 bucket + pre-signed URLs
   - Design proof uploads + previews
3) Hosting
   - Finalize prod deploy runbook + permissions
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
- Infra cleanup: replace deprecated CDK constructs (`DnsValidatedCertificate` -> `Certificate`, `S3Origin` -> `S3BucketOrigin`).

## Notes / lessons learned
- (Legacy ECS) Tasks fail with `CannotPullContainerError` until the image is pushed to ECR.
- Nest build output is `dist/src/main.js`; Dockerfile and `start:prod` must match.
- (Legacy ECS) ALB HTTPS targets on port 3000 require explicit protocol (HTTP).
- (Legacy ECS) Route53 ALIAS for ALB uses the ALB canonical hosted zone ID (from `describe-load-balancers`).
- Avoid manual DNS records if CDK will manage them; delete manual A/AAAA before CDK deploy.
- Cognito + Google IdP: redirect URI must be `https://<cognito-domain>/oauth2/idpresponse` and scopes are space-delimited (`openid email profile`).
- CDK deployments with security changes need approval or `--require-approval never` for non-interactive runs.
- Staging web deploy: S3 bucket `staging-staging-web-webbucket12880f5b-qqnt6ea0jfcd`, CloudFront `E1WNT7EZ9TRQSG` (`d3o7y05eeznahf.cloudfront.net`) (invalidate after upload).
- Prod web deploy: S3 bucket `prod-prod-web-webbucket12880f5b-bclsbbomyhnp`, CloudFront `E3P0DZ7ELUJ88C` (`d2dx9r012luvcq.cloudfront.net`) (invalidate after upload).
- Prod endpoints: app `https://app.signalcraftcoop.com`, api `https://api.signalcraftcoop.com`.
- If a CloudFront distribution is replaced (e.g., cert changes), re-run the web deploy and invalidate.
- If CloudFront serves JS as `text/plain`, re-upload assets with explicit `Content-Type`.
- RDS TLS requires the AWS CA bundle; bake `api/certs/rds-ca.pem` into the image and enable strict SSL.
- Prisma errors like `P2021` in prod often mean migrations were not applied; run the migration Lambda (CI does this now).
- GitHub Actions roles need CDK bootstrap access (SSM `GetParameter`, assets bucket access, and `iam:PassRole` for `cdk-hnb659fds-*`).
- Staging cost optimization: NAT removed to reduce cost; Lambda runs in VPC for RDS access.
- Lambda + HTTP API caveat: if Lambdas run in a VPC and need outbound internet, NAT costs return; avoid by limiting outbound or adding VPC endpoints. Consider RDS Proxy / Prisma Data Proxy for connection limits.
- Lambda test deploy command: `npx cdk deploy -c stage=staging -c enableLambdaApi=true signalcraft-staging/staging-api-lambda`.
- Cost review checklist: NAT gateways, RDS (instances + snapshots + backups), CloudWatch log retention, ECR image retention, Secrets Manager secrets, VPC endpoints, CloudFront logs, unused Route53 health checks.

