# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Use GitHub's private vulnerability reporting: on the repository page go to **Security → Report a vulnerability** (the "Security" tab, then "Advisories"). Include:

- what you found and where (file, route or feature),
- steps to reproduce, and the impact you expect,
- the Node.js version and operating system.

You can expect an acknowledgement as soon as a maintainer is available, and a fix or a clear answer afterwards. This is a volunteer project; there is no bounty program.

## Supported versions

Only the latest release (and the `main` branch) receives security fixes.

## Scope and threat model

- **The admin panel (`admin/`) is for local use only.** It binds to `127.0.0.1`, checks the `Host` header, and is designed for a single owner on their own computer. **Do not expose it to the internet** (no port forwarding, reverse proxy, tunnel or public hosting). Running it that way is outside the supported threat model, and reports that depend on it will not be treated as vulnerabilities.
- In scope: bypassing authentication, CSRF or origin checks, path traversal, unsafe file upload handling, stored XSS through content (the site is expected to render content as text), the validator accepting dangerous URLs, and anything that lets a web page on another origin act on the local admin.
- The **published site (`site/`)** is static files. Issues in its scripts (for example DOM injection from content) are in scope.
- Out of scope: vulnerabilities in third-party services (Google Fonts, your host), a compromised local machine, and issues only reproducible with the admin exposed to a network.

## Hardening tips for users

- Keep Node.js and dependencies up to date (`npm audit`, `npm update`).
- Publish only the `site/` folder; never deploy `admin/`.
- Use a strong admin password. To reset it, delete `admin/.auth.json` and restart.
- Do not commit `admin/.auth.json` or `admin/backups/` (both are git-ignored by default).
