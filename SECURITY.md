# Security policy — APD Isola

This is a public static website. The content editor at `/admin/` is a **public local draft editor**, not a protected login or authorization boundary. Publishing requires a separately authorized GitHub account.

## Reporting a security issue
Do not publish credentials, private information or exploit details in a public issue. Contact the association privately through its official contact channels.

## Operational requirements
- Enable two-factor authentication (prefer passkeys/security keys) for every repository collaborator.
- Give write access only to trusted maintainers; review access regularly.
- Configure branch protection/rulesets for `main`: require pull requests and passing checks; prevent force pushes and deletions.
- In GitHub Pages, verify the custom domain and enforce HTTPS once DNS and certificate are ready.
- Never commit secrets, personal data, completed forms, or access tokens.
- Review third-party links and dependencies before publishing.

Automated checks cover common patterns, not every vulnerability. A live HTTPS/TLS and browser audit is required before launch.

Legacy preview snapshots under `/anteprima/` and `/anteprima-premium/` are excluded from live-site link checks; do not use them as launch URLs.
