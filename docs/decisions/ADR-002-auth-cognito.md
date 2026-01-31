# ADR-002: Use AWS Cognito for authentication

Date: 2026-01-31
Status: Accepted

Context
- We need a secure auth system with password resets and optional MFA.
- We are already building on AWS.

Decision
- Use AWS Cognito for user management and JWT issuance.
- Use a Cognito Identity Pool for optional browser-side AWS credentials (e.g., S3 uploads).

Alternatives
- Custom JWT auth
- Auth0 or Clerk

Consequences
- Reduced security burden and faster setup.
- Some limitations in hosted UI customization.
