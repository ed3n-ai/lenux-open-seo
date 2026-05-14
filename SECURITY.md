# Security Policy

## Reporting Security Issues

Please do not open a public issue for vulnerabilities, leaked credentials, or
private deployment details.

Report security concerns privately to the repository owner or maintainer. If no
private channel is available, open a minimal public issue that says a private
security report is needed, without including exploit details or secrets.

## Secrets and Credentials

Never commit:

- `.env`, `.env.local`, `.dev.vars`, or production environment files.
- Cloudflare API tokens.
- DataForSEO credentials or base64-encoded `login:password` values.
- GitHub tokens, SSH private keys, OAuth secrets, or service account keys.
- Customer data, crawl exports, or private analytics exports.

Use local environment files, Cloudflare Worker secrets, GitHub Actions secrets,
or another secret manager instead.

## Supported Security Posture

This project is provided as self-hosted software. Operators are responsible for:

- Keeping dependencies and deployment platforms updated.
- Configuring authentication correctly.
- Controlling access to API keys and SEO data.
- Reviewing generated content before publication.
- Monitoring third-party API usage and cost.
