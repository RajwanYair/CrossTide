# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email the maintainers directly (or use GitHub's private vulnerability reporting)
3. Include a description of the vulnerability and steps to reproduce
4. Allow reasonable time for a fix before public disclosure

## Scope

- XSS vulnerabilities in DOM rendering
- Injection via user input (ticker symbols, config import)
- Sensitive data exposure in localStorage or console
- Insecure fetch patterns (missing CORS, credential leakage)
- Supply chain risks in dependencies

## Security Best Practices (for contributors)

- Never commit API keys, tokens, or secrets
- Sanitize all user input before inserting into the DOM
- Use `textContent` instead of `innerHTML` where possible
- Use `.env` files for local API keys (listed in `.gitignore`)
- Use GitHub Secrets for CI/CD credentials
- Validate and sanitize all external input (API responses, imported JSON)
- Keep dependencies updated — Dependabot is enabled for weekly checks
- Review Content Security Policy headers when deploying
