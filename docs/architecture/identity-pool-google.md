# Cognito Identity Pool + Google Auth (Frontend Guide)

This guide covers using a Cognito Identity Pool with Google as an external IdP.

## Prereqs
- Cognito User Pool already set up for core auth (JWTs used by API).
- Cognito Identity Pool created with Google as a supported provider.
- Google OAuth Client ID configured in the Identity Pool.

## Environment values (frontend)
- Identity Pool ID (e.g. us-west-2:xxxx-xxxx)
- Region (e.g. us-west-2)
- Google OAuth Client ID

## Recommended flow (browser)
1) User signs in with Google (OAuth) via Google Identity Services.
2) Google returns an ID token.
3) Use the ID token to fetch AWS credentials from Cognito Identity Pool.
4) Use AWS credentials for direct S3 uploads or other AWS services.

## Token exchange (Identity Pool)
- Provider name is `accounts.google.com`
- You pass `{ Logins: { 'accounts.google.com': GOOGLE_ID_TOKEN } }`
- Cognito returns temporary AWS credentials and an identity id

## SDK note
- The AWS JS SDK v3 supports Cognito Identity Pools for credential retrieval.
- You do not use the User Pool for this exchange; you use the Identity Pool.

## Security notes
- Keep Google Client ID and Identity Pool ID public-safe (they are not secrets).
- Protect any backend credentials; only temporary, scoped AWS creds should reach the browser.
- Use IAM roles on the identity pool to limit what the browser can do (e.g., S3 put only).

## Next steps
- Add a frontend utility to fetch identity pool config from `/auth/identity-pool-config`.
- Implement Google login button and handle the ID token in the client.
- Configure S3 CORS + bucket policy for browser uploads.