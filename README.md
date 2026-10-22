<div align="center">

<img src="docs/screenshots/banner.png" alt="Ember: Portfolio Template. Dark and light theme previews" width="100%">

# Ember: Portfolio Template

**A calm, bilingual (TR/EN) portfolio site with a campfire that grows as you scroll, plus a local admin panel so you never have to touch code to update it.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![No build step](https://img.shields.io/badge/build%20step-none-brightgreen)](#how-it-works)
[![Zero-dependency site](https://img.shields.io/badge/site%20dependencies-0-brightgreen)](#how-it-works)
[![Made with vanilla JS](https://img.shields.io/badge/made%20with-vanilla%20JS-F7DF1E?logo=javascript&logoColor=black)](#how-it-works)

[Türkçe README](README.tr.md) · [Quick start](#quick-start) · [Customize](#customize) · [Deploying](#deploying) · [Docs](#documentation)

</div>

---

## Features

- 🔥 **Scroll-driven campfire**: a canvas fire in the bottom-left corner that grows from embers to a roaring blaze as you scroll. It can be switched off in Settings and respects `prefers-reduced-motion`.
- 📄 **Stacked page transitions**: the home page is a sequence of sections that slide over each other like pages being opened.
- 🌗 **Dark and light themes** with a remembered preference (or follow the system), and a one-field accent colour override.
- 🌍 **Turkish and English** built in, with an instant language switch.
- 🧩 **All content in one file**: `site/data/content.js` is the single source of truth (projects, blog posts, gallery, bio, skills, contact, settings).
- 🛠️ **Local admin panel** (Node + Express) to edit everything in a form UI: block-based blog editor, drag-to-reorder lists, image upload, live preview, automatic backups.
- ♿ **Accessibility-minded**: semantic HTML, skip link, keyboard navigation, visible focus, reduced-motion support.
- 🚀 **No build step**: plain HTML, CSS and vanilla JS. Open `site/index.html` or serve the folder anywhere.
- 🔒 **Safe by default**: the admin only listens on `127.0.0.1`, and rendered content is plain text (no HTML injection).

## Screenshots

| Dark | Light |
|---|---|
| ![Hero, dark theme](docs/screenshots/hero-dark.png) | ![Hero, light theme](docs/screenshots/hero-light.png) |

**The fire grows with your scroll** (embers, mid, full blaze):

| Embers | Mid | Full |
|---|---|---|
| ![Fire: embers](docs/screenshots/fire-ember.png) | ![Fire: mid](docs/screenshots/fire-mid.png) | ![Fire: full](docs/screenshots/fire-full.png) |

**Page-opening transition** (two sections overlapping mid-scroll):

![Stacking transition between two sections](docs/screenshots/stacking.png)

| Projects | Blog post |
|---|---|
| ![Projects page with tag filters](docs/screenshots/projects.png) | ![Blog post page](docs/screenshots/blog-post.png) |

| Gallery | About: skill bars and rings |
|---|---|
| ![Gallery grouped by theme](docs/screenshots/gallery.png) | ![About page skills](docs/screenshots/about-skills.png) |

**Mobile** (390x844):

<p>
  <img src="docs/screenshots/mobile-hero.png" alt="Mobile hero" width="240">
  <img src="docs/screenshots/mobile-menu.png" alt="Mobile menu open" width="240">
</p>

**Admin panel** (runs locally, never published):

| Setup | Dashboard |
|---|---|
| ![Admin first-run password setup](docs/screenshots/admin-setup.png) | ![Admin dashboard, dark](docs/screenshots/admin-dashboard.png) |

| Project editor | Blog block editor |
|---|---|
| ![Admin project editor](docs/screenshots/admin-project-edit.png) | ![Admin blog block editor](docs/screenshots/admin-blog-editor.png) |

| Gallery | Settings |
|---|---|
| ![Admin gallery](docs/screenshots/admin-gallery.png) | ![Admin settings](docs/screenshots/admin-settings.png) |

Light admin theme with the live preview panel open:

![Admin dashboard, light theme](docs/screenshots/admin-dashboard-light.png)

> The example content is placeholder text and generated SVG art. The site name is simply "Name".

## Quick start

You need [Node.js](https://nodejs.org) 18 or newer. Node is only needed for the admin panel; the site itself needs nothing.

1. **Get the code.** Click **Use this template** on GitHub, or clone it:

   ```bash
   git clone https://github.com/YOUR-USERNAME/portfolio-site.git
   cd portfolio-site
   ```

2. **Install** the two admin dependencies (`express`, `multer`):

   ```bash
   npm install
   ```

3. **Start** the admin and preview server:

   ```bash
   npm start
   ```

4. **Open** <http://localhost:3000/admin/>. On first run you choose a password (at least 8 characters). Then edit your content and press **Save** (or `Ctrl+S`).
5. **Preview your site** at <http://localhost:3000/>, or use the Preview panel inside the admin.

**No Node?** The site is static. Double-click `site/index.html` and it works from `file://`. You can edit `site/data/content.js` by hand (see [the schema](docs/04-content-schema.md)).

To use another port: `PORT=3100 npm start` (PowerShell: `$env:PORT=3100; npm start`).

## Customize

### Your content (recommended: the admin)

Everything you see on the site comes from `site/data/content.js`. The admin panel edits this file for you, validates it before saving, and keeps backups. Sections in the admin: Dashboard, Personal info, About me, Projects, Blog, Gallery, Settings, Backups, Account.

### The content file format

`content.js` is one assignment with a JSON body, so it works without a server or `fetch`:

```js
/* content.js: single source of truth ... */
window.SITE_CONTENT = {
  "site": { "name": { "tr": "Name", "en": "Name" }, "avatar": "img/portrait.svg" },
  "projects": [ { "id": "proj-1", "slug": "first-project",
                  "title": { "tr": "İlk proje", "en": "First project" },
                  "image": "img/proj-1.svg", "status": "done",
                  "featured": true, "order": 1, "visible": true } ],
  "posts": [], "gallery": [],
  "settings": { "defaultLang": "en", "defaultTheme": "system", "fire": true, "cursor": true }
};
```

Text fields are `{ "tr": "...", "en": "..." }` pairs; an empty `en` falls back to `tr`. Blog posts are lists of typed blocks (`heading`, `paragraph`, `image`, `code`, `quote`, `list`), not HTML. The full field reference and validation rules are in [docs/04-content-schema.md](docs/04-content-schema.md) (currently written in Turkish).

Check a file at any time with:

```bash
npm run validate
```

### Fire, cursor, theme and accent

In **Admin → Settings** (or the `settings` object in `content.js`):

| Setting | Effect |
|---|---|
| `fire` | `false` disables the campfire animation |
| `cursor` | `false` disables the custom cursor (it is only used with a mouse or pen anyway) |
| `defaultTheme` | `dark`, `light` or `system` when the visitor has no saved choice |
| `defaultLang` | `tr` or `en` when the visitor has no saved choice |
| `accentOverride` | Optional accent colour (`#rgb`, `#rrggbb`, `rgb()`, `hsl()`), applied on top of the theme |

### Colours and design tokens

Colours, spacing and motion values are CSS custom properties at the top of [`site/css/main.css`](site/css/main.css): `--bg`, `--fg`, `--accent`, `--accent-hot` and friends, defined once for the dark theme and once for `[data-theme="light"]`. The fire has its own tokens in [`site/css/fire.css`](site/css/fire.css). The design rationale is in [docs/01-art-direction.md](docs/01-art-direction.md).

### Interface text and translations

Menu, button and form-error strings live in [`site/js/i18n.js`](site/js/i18n.js) (`window.I18N_DICT`, one object per language). Edit them there. Page content comes from `content.js`, never from `i18n.js`.

> Adding a third language is not a content-only change today. See the [FAQ](#faq).

## How it works

```mermaid
flowchart LR
  subgraph Local["Your computer"]
    A["Admin UI<br/>admin/public"] -->|"JSON over fetch<br/>session + CSRF"| B["Express server<br/>admin/server.js"]
    B -->|"validate, back up, atomic write"| C[("site/data/content.js")]
    B -->|"uploads"| D["site/img/uploads/"]
  end
  C --> E["Static site<br/>site/*.html + css + js"]
  D --> E
  E -->|"publish only site/"| F["GitHub Pages / Netlify / any static host"]
```

- The **site** is static. Each page loads `data/content.js` first, then `js/render.js` builds lists, cards and blog posts from it using `createElement` and `textContent` only.
- The **admin** is an Express app bound to `127.0.0.1`. It reads and writes `content.js`, stores uploaded images, and also serves `site/` at `/` so you can preview it.
- **Publishing** means copying only `site/` to a static host. `admin/` stays on your machine.

### Project structure

```text
.
├── site/                    # the website: this is all you publish
│   ├── index.html           # home: stacked sections (hero, about, projects, blog, gallery, contact)
│   ├── hakkimda.html        # about
│   ├── projeler.html        # projects (tag filters)
│   ├── blog.html            # blog list
│   ├── post.html            # blog post (post.html?slug=...)
│   ├── galeri.html          # gallery with lightbox
│   ├── iletisim.html        # contact
│   ├── data/content.js      # all site content
│   ├── css/                 # main, pages, journey (stacking), fire, cursor
│   ├── js/                  # render, i18n, theme, main, fire (canvas), cursor
│   └── img/                 # placeholder art; admin uploads go to img/uploads/
├── admin/                   # local-only admin panel (not published)
│   ├── server.js            # entry point (binds to 127.0.0.1)
│   ├── lib/                 # app, auth, validate, uploads, backups, content I/O, config
│   ├── public/              # admin front-end (vanilla JS views)
│   ├── scripts/validate.js  # `npm run validate`
│   └── test/                # node:test suites
├── docs/                    # design notes, content schema, screenshots
├── .github/                 # CI, Pages deploy workflow, issue/PR templates
└── package.json
```

Page file names are Turkish (`hakkimda`, `projeler`, `galeri`, `iletisim`) because the template started as a Turkish site; the visible labels are translated.

## Admin panel

**What you can do**

- Edit personal info, bio, skills (bars or rings), interests, timeline, FAQ and socials.
- Create, reorder (drag or arrows), hide and delete projects, posts and gallery items.
- Write posts with a block editor (heading, paragraph, image, code, quote, list), each text in TR and EN.
- Upload images (drag and drop up to 20 files, 5 MB each) and reuse them from a picker.
- See a live preview, run **Check content** to validate, and save with `Ctrl+S`.
- Restore an earlier version from **Backups**, change the password, switch the panel language (TR/EN) and theme.

**Security summary**

| Measure | Detail |
|---|---|
| Local only | Listens on `127.0.0.1` only and rejects any other `Host` header (DNS-rebinding guard) |
| Password | Stored as a salted `scrypt` hash in `admin/.auth.json` (never in plain text); login attempts are rate limited |
| Sessions | `HttpOnly`, `SameSite=Strict` cookie, expiring sessions |
| CSRF | Per-session token on every write, plus `Origin` and Fetch-Metadata checks |
| Uploads | File type detected from magic bytes (not the extension), size and count limits, random file names, never overwrites |
| No SVG uploads | SVG can carry scripts, so it is not accepted (the bundled placeholder art is SVG, shipped by the template) |
| Content safety | Server-side validation of every field; `javascript:` / `data:` URLs are rejected; the site renders text, not HTML |
| Backups | Every changing save and every restore first copies the current `content.js` into `admin/backups/` (the newest 30 are kept) |
| Atomic writes | Content is written to a temp file and renamed |

> **Never expose the admin to the internet** (no port forwarding, no tunnels, no hosting it). It is designed for your own machine. See [SECURITY.md](SECURITY.md).

**Forgot the password?** Stop the server, delete `admin/.auth.json`, start again, and choose a new password. Your content is not affected.

## Deploying

Only the **`site/`** folder is published. Do not deploy `admin/`; it is a local tool.

Before deploying, check the file once: `npm run validate`.

> By default `.gitignore` excludes `site/img/uploads/*` so personal uploads are not committed by accident. If you upload images through the admin and deploy from Git, remove those two lines from `.gitignore` so the images are committed and published.

### GitHub Pages (included workflow)

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) publishes `site/` on every push to `main` and on manual runs.

1. Push your repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow from the **Actions** tab). The site appears at `https://YOUR-USERNAME.github.io/portfolio-site/`.

All asset paths in the site are relative, so it works under a project sub-path.

### Netlify, Vercel, Cloudflare Pages, any static host

Use the same settings everywhere:

- **Build command**: none
- **Publish / output directory**: `site`

For Netlify you can also drag the `site` folder onto the deploy page. With any other host (S3, nginx, shared hosting), upload the contents of `site/`.

## Performance & accessibility

What the template does, without big promises:

- No framework, no bundler, no runtime dependencies on the site side. Scripts are loaded with `defer`.
- Images are written with `width`/`height` and `loading="lazy"`; keep your files within the recommended sizes (see the FAQ).
- The fire canvas caps its resolution (device pixel ratio capped at 1.5, 1.25 on mobile) and responds to `visibilitychange`.
- Scroll reveals use `IntersectionObserver`; `prefers-reduced-motion` turns animations down.
- Semantic landmarks, a skip link, labelled controls, `aria-live` form errors and keyboard-operable menus.

Measured earlier on the bundled sample content with Lighthouse: **Accessibility, Best Practices and SEO scored 100**. Performance was not benchmarked here and depends on your images, fonts and device; run Lighthouse on your own content before you rely on any number. Fonts are loaded from Google Fonts, which is the only external request.

## Browser support

Current versions of Chrome, Edge, Firefox and Safari. The site uses CSS custom properties, `IntersectionObserver`, `<canvas>` and `color-mix()` (for the accent override). I have not run an automated cross-browser matrix; if something breaks in a browser you care about, please open an issue.

## FAQ

**Can I use it without the admin panel?**
Yes. `site/` is plain static files. Edit `site/data/content.js` by hand, or delete `admin/`, `package.json` and `node_modules` from your own copy if you never want them. Run `npm run validate` before publishing if you keep Node around.

**Is it really multilingual?**
Two languages, Turkish and English, with a switcher. Every text field holds one value per language. If you only need one language, set `defaultLang` and fill that language in; the other can mirror it.

**How do I add a new language or section?**
A new language needs code changes: add a dictionary to `site/js/i18n.js`, accept the new key in the localized-field handling of `site/js/render.js`, add a switcher button, and extend the validator and admin forms (`admin/lib/validate.js`, `admin/public/js/`). A new section means a new `data-render` block in the HTML plus a renderer in `render.js`. Both are on the [roadmap](#roadmap) to make easier.

**What image sizes should I use?**
Portrait 600x800, projects and gallery 800x600 (up to 1600 px wide for the lightbox), blog cover 1200x675. Aim for under 300 KB each; the hard limit is 5 MB per upload. Allowed: PNG, JPG, WebP, GIF, AVIF.

**I forgot my admin password.**
Delete `admin/.auth.json` and restart; see [Admin panel](#admin-panel).

**Where are my backups?**
In `admin/backups/` (git-ignored), as `content-YYYYMMDD-HHMMSS.js`. Restore them from the Backups page or copy one over `site/data/content.js`.

**Why do some file names look Turkish?**
The template started life as a Turkish-language site. Visible text is translated; the page file names are kept so existing links do not break.

**The contact form does not send anything.**
Correct: the sample form only validates in the browser and shows a thank-you message. Connect it to a form service or a backend of your choice.

## Roadmap

Ideas, not promises:

- [ ] A documented, easier path for adding more languages
- [ ] English version of the content schema doc
- [ ] A real contact-form integration example
- [ ] Optional image resizing on upload
- [ ] Screenshot and accessibility checks in CI

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first, and please follow the [Code of Conduct](CODE_OF_CONDUCT.md). For security problems, see [SECURITY.md](SECURITY.md) and do not open a public issue.

```bash
npm install
npm test            # admin test suites (node:test)
npm run validate    # validates site/data/content.js
```

## Documentation

The files in [`docs/`](docs/) are **design notes** from the project's planning phase, not a user manual.

| File | What it is |
|---|---|
| [docs/04-content-schema.md](docs/04-content-schema.md) | Current content schema (up to date; Turkish) |
| [docs/01-art-direction.md](docs/01-art-direction.md) | Visual direction and design tokens (design notes; Turkish) |
| [docs/02-ux-structure.md](docs/02-ux-structure.md) | Early UX structure draft (design notes; may be outdated) |
| [docs/03-backend-content.md](docs/03-backend-content.md) | Early backend plan (design notes; **superseded** by the schema above) |

## License

[MIT](LICENSE) © 2026 Portfolio Template Contributors.

## Acknowledgements

- [Fraunces](https://fonts.google.com/specimen/Fraunces) and [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts (both under the SIL Open Font License).
- [Express](https://expressjs.com) and [Multer](https://github.com/expressjs/multer) for the admin server.
- The Contributor Covenant for the code of conduct.
