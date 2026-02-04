RDS CA bundle

Place the AWS RDS CA bundle at:

  api/certs/rds-ca.pem

The Docker image copies this file and installs it into the OS trust store.
Without it, strict TLS verification will fail when DB_SSLMODE=verify-full.

CI: GitHub Actions downloads the bundle automatically before building the API
image, so local-only runs are the main case where you need to place the file.

Suggested download (run locally, not in CI):
  - https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

Save it as api/certs/rds-ca.pem, rebuild the API image, and redeploy.
