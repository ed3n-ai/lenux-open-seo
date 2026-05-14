# Contributing

Contributions are welcome when they improve the public, self-hosted OpenSEO
Community Edition.

## Contribution Terms

By submitting a pull request, issue patch, or other contribution, you agree
that:

- Your contribution is your original work, or you have the right to submit it.
- Your contribution is provided under the same MIT License used by this
  repository.
- You are not knowingly submitting secrets, private credentials, customer data,
  or code that violates a third-party license or terms of service.
- You understand that maintainers may edit, reject, or remove contributions to
  keep the public edition focused and maintainable.

## Public Edition Scope

Good public contributions usually fit one of these areas:

- Content manager workflows.
- SEO operator workflows.
- Self-hosting and setup improvements.
- DataForSEO cost awareness and safer defaults.
- Accessibility, usability, and interface quality.
- Bug fixes and test coverage.

Features that depend on private infrastructure, managed customer accounts,
closed commercial integrations, or agency automation should be discussed first.

## Before Opening a Pull Request

Run the relevant checks locally:

```sh
npm run types:check
npm run build
```

If your change touches secrets, authentication, billing, third-party APIs, or
deployment configuration, explain the risk and test path in the pull request.
