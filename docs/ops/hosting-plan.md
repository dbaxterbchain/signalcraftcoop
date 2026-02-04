# Hosting Plan (Staging + Prod)

Domain
- Prod web: app.signalcraftcoop.com
- Prod API: api.signalcraftcoop.com
- Staging web: staging.app.signalcraftcoop.com
- Staging API: staging.api.signalcraftcoop.com

Primary stack (AWS, long-term)
- Web: S3 + CloudFront + ACM
- API: ECS Fargate + ALB + ECR
- DB: RDS Postgres (private subnets)
- Auth: Cognito user pool + app client per environment
- Secrets: SSM Parameter Store (or Secrets Manager)
- DNS: Route53 hosted zone for signalcraftcoop.com
- Logging: CloudWatch

Environments
- staging: isolated resources, smaller instance sizes, shorter retention
- prod: isolated resources, higher availability settings

Networking
- One VPC per environment
- Public subnets: ALB + NAT
- Private subnets: ECS tasks + RDS
- Security groups: ALB -> ECS, ECS -> RDS

Data
- RDS Postgres with automated backups
- `DATABASE_URL` stored in SSM/Secrets
- Prisma migrations run against staging/prod during deploy

API database wiring (recommended)
- Keep RDS credentials in Secrets Manager.
- Pass DB fields to ECS tasks (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).
- API builds DATABASE_URL at runtime if DATABASE_URL is not set.

CI/CD (recommended)
- GitHub Actions
- Build web and upload to S3, then invalidate CloudFront
- Build API Docker image, push to ECR, update ECS service
- Deploy on `main` to staging
- Deploy on version tag to prod

Core AWS resources per environment
- Route53: hosted zone + records for app/api
- ACM: certificates for app/api (in us-east-1 for CloudFront)
- S3: web bucket
- CloudFront: web distribution
- ECR: API image repo
- ECS Fargate: cluster + service + task definition
- ALB: HTTPS listener -> ECS
- RDS: Postgres
- Cognito: user pool + app client
- IAM: task execution role, app role, CI role

Immediate next steps (staging first)
1) Provision staging VPC + RDS + Cognito + ECS + ALB (done).
2) Push API image to ECR and verify service stability (done).
3) Add ACM + HTTPS listener for staging API (in progress).
4) Deploy web to staging and confirm auth flow.
5) Repeat for prod once staging is stable.

CDK scaffolding
- Infra code lives in infra/ (TypeScript CDK app).
- Current stacks provision: VPC + RDS + Cognito + ECS/ALB (API).
- Web stack provisions S3 + CloudFront + Route53 + ACM.

Staging status
- VPC + RDS live in us-west-2
- Cognito user pool + app client live
- ECS service running with ALB
- Route53 `staging.api.signalcraftcoop.com` points to ALB
- HTTPS for API is being added (ACM + HTTPS listener)

Open decisions
- Secrets Manager vs SSM Parameter Store.
- RDS sizing and backups for prod.
- Email (SES) and monitoring (Sentry) timeline.
