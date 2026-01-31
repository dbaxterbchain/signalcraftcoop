# Security (Draft)

- Cognito handles auth and password resets.
- JWT validation at API gateway or API layer.
- Least privilege IAM roles.
- S3 files accessed only via pre-signed URLs.
- Webhooks verified for Stripe events.