# Contributing

Thanks for your interest in improving this template. Small, focused contributions are the easiest to review.

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). For security issues, see [SECURITY.md](SECURITY.md) and do not open a public issue.

## Ways to help

- Report bugs or rough edges (use the issue templates).
- Improve documentation, translations and accessibility.
- Fix an open issue or propose a feature first (open an issue to discuss before large changes).

## Development setup

You need Node.js 18 or newer.

```bash
git clone https://github.com/YOUR-USERNAME/portfolio-site.git
cd portfolio-site
npm install
npm start          # admin + preview at http://localhost:3000/admin/
```

The site in `site/` has no build step: edit the files and refresh the browser.

## Before you open a pull request

```bash
npm test           # runs the admin test suites (node:test)
npm run validate   # validates site/data/content.js
```

Both commands also run in CI on Node 20 and 22.

## Guidelines

- **Keep the site dependency-free.** No frameworks, bundlers or runtime npm packages for `site/`. Vanilla HTML, CSS and JS only.
- **Keep the admin local-only and safe.** Do not weaken the localhost binding, CSRF checks, upload validation or content validation. Add a test when you touch them.
- **Content is data.** Page text lives in `site/data/content.js`; interface strings live in `site/js/i18n.js`. Update the schema doc (`docs/04-content-schema.md`) and the validator (`admin/lib/validate.js`) together when you change the content shape.
- **Render text, not HTML.** Build DOM with `createElement` / `textContent`; never inject user content as HTML.
- **Accessibility and motion.** Keep keyboard access, focus styles, contrast and `prefers-reduced-motion` behaviour working.
- **No personal data.** Do not commit real names, emails, phone numbers, account names or private images. Use placeholders such as `name@example.com`.
- **Keep both READMEs in sync.** If you change `README.md`, update `README.tr.md` too (or say in the PR that a translation is needed).
- Match the existing code style; `.editorconfig` covers indentation and line endings.

## Commits and pull requests

- Use clear, imperative commit messages (for example `Fix lightbox focus trap`).
- One topic per pull request. Describe what changed and why, and include a screenshot for visual changes.
- Update `CHANGELOG.md` under an "Unreleased" heading for user-visible changes.
- Fill in the pull request template.

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
