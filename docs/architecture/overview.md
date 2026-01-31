# Architecture Overview

Goals
- Support custom orders and store orders on a single platform.
- Provide a clear design review loop for custom work.
- Scale from a small team to larger volume without rewrites.

Core stack
- Frontend: React + MUI (latest)
- API: Node + Nest (TypeScript)
- Auth: AWS Cognito
- Payments: Stripe
- Data: Postgres (AWS RDS)
- Assets: S3 (design files, proofs, mockups)
- Infra: Docker, ECS Fargate, CloudFront, S3
- Observability: CloudWatch, Sentry

High-level components
- Web app (React) served via S3 + CloudFront
- API service (Nest) deployed as Docker containers on ECS Fargate
- Postgres for users, orders, products, and design reviews
- S3 for file storage (artwork, mockups, proofs)
- Cognito for authentication and user pools
- Cognito Identity Pool for browser-side AWS credentials (e.g., S3 uploads)
- Stripe for payments and webhook events
- SES for transactional email

Data flow summary
1) User signs in through Cognito hosted UI or custom UI backed by Cognito.
2) Web app calls the API with Cognito JWT.
3) API reads and writes order data in Postgres.
4) Design files are stored in S3; API stores references in Postgres.
5) Optional: browser uses Identity Pool to get temporary AWS creds (for direct S3 uploads).
6) Stripe checkout creates payment intent; webhook updates order status.
7) Status updates are visible on the Orders page.

Environments
- dev, staging, prod
- Separate Cognito user pools and Stripe keys per environment

Security notes
- Least privilege IAM roles for API and CI.
- Pre-signed S3 URLs for uploads/downloads.
- All PII and order data stored only in Postgres.
