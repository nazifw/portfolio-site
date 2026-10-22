# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-22

First public release.

### Added

- Static portfolio site (plain HTML, CSS, vanilla JS, no build step): home with stacked section transitions, about, projects with tag filters, blog list and post pages, gallery with lightbox, and contact.
- Scroll-driven campfire canvas animation, custom cursor, dark and light themes, reduced-motion support.
- Turkish and English interface and content with an instant language switch.
- Single-file content model (`site/data/content.js`) with a documented schema (`docs/04-content-schema.md`).
- Local admin panel (`npm start`): personal info, about, projects, blog block editor, gallery, settings, backups restore, password change, live preview.
- Admin security: loopback-only binding, host allow-list, scrypt password hashing, rate-limited login, CSRF tokens with origin checks, image signature checks, no SVG uploads, server-side content validation, atomic writes and automatic backups.
- `npm run validate` content validator and `node:test` test suites.
- Repository files: README (EN/TR), LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue and pull request templates, CI workflow and a GitHub Pages deploy workflow.

[Unreleased]: https://github.com/YOUR-USERNAME/portfolio-site/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/YOUR-USERNAME/portfolio-site/releases/tag/v1.0.0
