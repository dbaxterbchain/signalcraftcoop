# CI/CD (Staging)

Staging deploys run from GitHub Actions using OIDC (no long-lived AWS keys).

## Workflow
- File: `.github/workflows/staging-deploy.yml`
- Trigger: pushes to `staging` branch (manual dispatch also supported)
- Steps:
  - Build + deploy web to S3 + CloudFront invalidation
  - Deploy Lambda HTTP API stack via CDK (`enableLambdaApi=true`)
  - Invoke the migration Lambda to run `prisma migrate deploy`

## OIDC Role
- Role ARN: `arn:aws:iam::089080661826:role/signalcraft-staging-github-actions`
- Trust: `repo:dbaxterbchain/signalcraftcoop:ref:refs/heads/staging`
- Permissions: scoped to staging S3, CloudFront, CloudFormation/CDK, Route53/ACM, and Lambda invoke

## Prod (manual)
- Workflow: `.github/workflows/prod-deploy.yml` (manual dispatch only)
- Role ARN: `arn:aws:iam::089080661826:role/signalcraft-prod-github-actions`
- Trust: `repo:dbaxterbchain/signalcraftcoop:ref:refs/heads/main`
- Inputs: bucket, distribution

## Notes
- No `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets are required.
- If the workflow fails to assume role, confirm:
  - The branch is `staging`
  - GitHub Actions permissions include `id-token: write`
- Prisma migrations are executed via the migration Lambda inside the VPC.
