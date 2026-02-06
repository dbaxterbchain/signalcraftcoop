# Hosting Plan (Staging + Prod)

Domain
- Prod web: app.signalcraftcoop.com
- Prod API: api.signalcraftcoop.com
- Staging web: staging.app.signalcraftcoop.com
- Staging API: staging.api.signalcraftcoop.com

Primary stack (AWS, long-term)
- Web: S3 + CloudFront + ACM
- API: Lambda (Node/Nest) + API Gateway HTTP API + custom domain
- DB: RDS Postgres (private subnets)
- Auth: Cognito user pool + app client per environment
- Secrets: Secrets Manager (DB creds) + app envs
- DNS: Route53 hosted zone for signalcraftcoop.com
- Logging: CloudWatch

Environments
- staging: isolated resources, smaller instance sizes, shorter retention
- prod: isolated resources, higher availability settings

Networking
- One VPC per environment
- Public subnets: NAT (optional), API Gateway is public
- Private subnets: RDS, Lambda ENIs
- Security groups: Lambda -> RDS

Data
- RDS Postgres with automated backups
- `DATABASE_URL` stored in SSM/Secrets
- Prisma migrations run against staging/prod during deploy

API database wiring (recommended)
- Keep RDS credentials in Secrets Manager.
- Lambda reads DB fields (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).
- API builds DATABASE_URL at runtime if DATABASE_URL is not set.

CI/CD (recommended)
- GitHub Actions (OIDC)
- Build web and upload to S3, then invalidate CloudFront
- Deploy Lambda HTTP API stack via CDK
- Invoke migration Lambda to run `prisma migrate deploy`
- Deploy on `staging` branch to staging
- Manual deploy to prod

Core AWS resources per environment
- Route53: hosted zone + records for app/api
- ACM: certificates for app/api (in us-east-1 for CloudFront)
- S3: web bucket
- CloudFront: web distribution
- API Gateway HTTP API + Lambda
- RDS: Postgres
- Cognito: user pool + app client
- IAM: Lambda roles + CI role

Immediate next steps (staging first)
1) Verify staging API + web after Lambda cutover.
2) Promote to prod and verify auth + products/orders.
3) Finalize CI/CD hardening and runbook updates.

CDK scaffolding
- Infra code lives in infra/ (TypeScript CDK app).
- Current stacks provision: VPC + RDS + Cognito + Lambda HTTP API.
- Web stack provisions S3 + CloudFront + Route53 + ACM.

Staging status
- VPC + RDS live in us-west-2
- Cognito user pool + app client live
- Lambda HTTP API deployed
- Route53 `staging.api.signalcraftcoop.com` points to API Gateway

Open decisions
- RDS sizing and backups for prod.
- Email (SES) and monitoring (Sentry) timeline.
