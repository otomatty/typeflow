# Security Policy

## Supported Versions

We actively support the following versions of TypeFlow with security updates:

| Version  | Supported          |
| -------- | ------------------ |
| Latest   | :white_check_mark: |
| < Latest | :x:                |

## Reporting a Vulnerability

We take the security of TypeFlow seriously. If you discover a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

### How to Report

Please send an email to the maintainer with the following information:

- **Type of issue** (e.g., XSS, CSRF, data leakage, etc.)
- **Full paths** of source file(s) related to the manifestation of the issue
- **Location** of the affected source code (tag/branch/commit or direct URL)
- **Special configuration** required to reproduce the issue
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept** or exploit code (if possible)
- **Impact** of the issue, including how an attacker might exploit the issue

### What to Expect

- We will acknowledge receipt of your report within 48 hours
- We will provide an initial assessment within 7 days
- We will keep you informed of our progress
- We will notify you when the vulnerability has been fixed

### Disclosure Policy

- We will coordinate with you on the disclosure timeline
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- We will publish a security advisory after the vulnerability has been fixed

## Security Best Practices

Since TypeFlow is a client-side application that stores data locally in IndexedDB:

- **No server-side data**: All data is stored locally in your browser
- **No authentication**: The application does not require login or authentication
- **Local-first**: The application works entirely offline

However, if you are deploying TypeFlow as a web service, please ensure:

- HTTPS is enabled
- Content Security Policy (CSP) headers are properly configured
- Regular security updates are applied to dependencies

## Known Security Considerations

- **IndexedDB Storage**: User data is stored in the browser's IndexedDB. Users should be aware that clearing browser data will remove their word lists and statistics.
- **No Data Transmission**: The application does not transmit data to external servers by default.
- **Dependencies**: We regularly update dependencies to address security vulnerabilities. Please keep your dependencies up to date.

## Contact

For security-related inquiries, please contact the maintainer directly.

Thank you for helping keep TypeFlow and its users safe!
