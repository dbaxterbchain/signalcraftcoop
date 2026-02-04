# Signalcraft Infrastructure (CDK)

This folder contains the AWS CDK app for staging and production.

## Quick start
```bash
cd infra
npm install
```

Bootstrap once per account/region:
```bash
npx cdk bootstrap aws://ACCOUNT_ID/us-west-2
```

Synthesize (no deploy):
```bash
npx cdk synth -c stage=staging
```

Deploy staging:
```bash
npx cdk deploy -c stage=staging
```

Deploy prod:
```bash
npx cdk deploy -c stage=prod
```

## Stage config
- staging: staging.app.signalcraftcoop.com, staging.api.signalcraftcoop.com
- prod: app.signalcraftcoop.com, api.signalcraftcoop.com
- Route53 hosted zone ID is set in `infra/lib/config.ts`.

## Notes
- The current stacks provision VPC, RDS Postgres, Cognito, and ECS/ALB (API).
- The web stack adds S3 + CloudFront + Route53 + ACM for the app domain.
- API TLS uses ACM DNS validation; ensure the Route53 zone exists for `signalcraftcoop.com`.

## Deploy web (staging)
```bash
npx cdk deploy -c stage=staging signalcraft-staging/staging-web --require-approval never
```

Upload the web build:
```bash
cd web
npm run deploy:staging
```

Staging values (current):
```bash
aws s3 sync dist s3://staging-staging-web-webbucket12880f5b-qqnt6ea0jfcd --delete
aws cloudfront create-invalidation --distribution-id E1WNT7EZ9TRQSG --paths "/*"
```

Note: if JS/CSS load with `text/plain`, re-upload with explicit content-types:
```bash
aws s3 cp dist s3://staging-staging-web-webbucket12880f5b-qqnt6ea0jfcd --recursive --exclude "*" --include "*.js" --content-type application/javascript
aws s3 cp dist s3://staging-staging-web-webbucket12880f5b-qqnt6ea0jfcd --recursive --exclude "*" --include "*.css" --content-type text/css
aws s3 cp dist s3://staging-staging-web-webbucket12880f5b-qqnt6ea0jfcd --recursive --exclude "*" --include "*.map" --content-type application/json
aws s3 cp dist s3://staging-staging-web-webbucket12880f5b-qqnt6ea0jfcd --recursive --exclude "*" --include "*.svg" --content-type image/svg+xml
aws s3 cp dist s3://staging-staging-web-webbucket12880f5b-qqnt6ea0jfcd --recursive --exclude "*" --include "*.html" --content-type text/html
aws cloudfront create-invalidation --distribution-id E1WNT7EZ9TRQSG --paths "/*"
```

## Deploy web (prod)
```bash
npx cdk deploy -c stage=prod signalcraft-prod/prod-web --require-approval never
```

Upload the web build (fill in outputs):
```bash
cd web
npm run build
aws s3 sync dist s3://<ProdWebBucketName> --delete
aws cloudfront create-invalidation --distribution-id <ProdWebDistributionId> --paths "/*"
```

Prod script placeholder:
```bash
npm run deploy:prod
```

## Web build modes
- `npm run build:staging` uses `web/.env.staging` (staging API + Cognito)
- `npm run build:prod` uses `web/.env.production` (prod API + Cognito)

## CI/CD (staging)
GitHub Actions uses OIDC to assume:
`arn:aws:iam::089080661826:role/signalcraft-staging-github-actions`

Trigger branch: `staging`.

## API deploy parameters
The API stack only requires WebOrigin as a parameter (Cognito is provisioned by CDK).

Example (staging):
```bash
npx cdk deploy -c stage=staging signalcraft-staging/staging-api \
  -c apiImageTag=latest \
  --parameters WebOrigin=https://staging.app.signalcraftcoop.com
```

## Database migrations (staging/prod)
RDS is private, so run migrations inside the VPC using a one-off ECS task.

Staging example (after image push + stack deploy):
```bash
aws ecs run-task --region us-west-2 \
  --cluster staging-staging-api-ClusterEB0386A7-NkWLQpu3ozv2 \
  --launch-type FARGATE \
  --task-definition signalcraftstagingstagingapiApiServiceTaskDef9E66C782:1 \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-021a3e46812d3bd8b,subnet-0de5fb29fac5226bc],securityGroups=[sg-0b7f441cc27c9fc21],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"web","command":["npx","prisma","migrate","deploy"]}]}'
```

Note: the API image must include the Prisma CLI (we keep `prisma` as a production dependency).
The Prisma config now supports `DB_*` variables, so the one-off task does not need `DATABASE_URL`.

RDS TLS (recommended):
- Place the AWS RDS CA bundle at `api/certs/rds-ca.pem` (see `api/certs/README.md`).
- The API stack sets:
  - `DB_SSLMODE=verify-full`
  - `DB_SSL_REJECT_UNAUTHORIZED=true`
  - `DB_SSL_CA_PATH=/app/certs/rds-ca.pem`
- Rebuild and push the API image after adding the CA bundle, then redeploy the API stack.

## Build and push API image
The ECS service expects the API image in ECR. Push before deploying the API stack or if tasks fail with `CannotPullContainerError`.

```bash
# from repo root
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 089080661826.dkr.ecr.us-west-2.amazonaws.com

docker build -t signalcraft-api:latest ./api
# staging repo name created by CDK: signalcraft-api-staging
# prod repo name created by CDK: signalcraft-api-prod
# (replace the repo below if you deploy prod)
docker tag signalcraft-api:latest 089080661826.dkr.ecr.us-west-2.amazonaws.com/signalcraft-api-staging:latest
docker push 089080661826.dkr.ecr.us-west-2.amazonaws.com/signalcraft-api-staging:latest
```

Helper (ECR login only):
```bash
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 089080661826.dkr.ecr.us-west-2.amazonaws.com
```

Force the service to pull the new image (staging example):
```bash
aws ecs update-service --region us-west-2 \
  --cluster <cluster-name> \
  --service <service-name> \
  --force-new-deployment
```

Find cluster/service names:
```bash
aws ecs list-clusters --region us-west-2
aws ecs list-services --region us-west-2 --cluster <cluster-name>
```

