# 05 - Security notes

## Threat model

The admin panel is a **local-only** tool. It binds to `127.0.0.1` and is meant to be used by the person who runs it on their own machine. Do **not** expose it to the internet (no port forwarding, tunnels or reverse proxies). Publish only the static `site/` folder.

## Measures in place

- Binds to loopback only; `Host` allow-list (`127.0.0.1`, `localhost`, `[::1]`) against DNS rebinding.
- Passwords hashed with scrypt (random salt, constant-time compare); `admin/.auth.json` is written with mode 0600.
- Login and password-change attempts are counted *before* the password is checked, so parallel requests cannot bypass the rate limit; failures add a growing delay.
- First-time setup runs under a lock and writes the auth file exclusively, so a second concurrent setup gets `409`.
- Sessions: random 256-bit ids, `HttpOnly; SameSite=Strict; Path=/admin` cookie, idle and absolute timeouts, CSRF token on every mutation, Origin / Fetch-Metadata checks, JSON-only mutation routes.
- Strict CSP for the admin UI (`script-src 'self'`), `nosniff`, `frame-ancestors 'none'`.
- Content is sanitized (control characters, `__proto__`/`constructor`/`prototype` keys) and validated (URL schemes, image paths, lengths) on every save and on every backup restore. `force` on restore only skips the "image file exists" checks.
- Uploads: magic-byte check, no SVG, size and count limits, server-generated file names.
- The site renderer writes user text only through `textContent`/`setAttribute` and filters URLs through an allow-list (`http`, `https`, `mailto`, `tel`, relative paths; images: `http`, `https`, relative).

## Known limitations

- **First password:** whoever reaches `/admin` first on the machine sets the initial password. On a shared computer, set it right after starting the server.
- **No CSP on the site:** the pages contain a small inline script that prevents a theme flash, so a strict CSP is not applied. The site is static and renders only allow-listed URLs, but keep it free of third-party scripts you do not trust.
- **Sessions live in memory:** restarting the server logs everyone out.
- **Hand-edited `site/data/content.js` is not validated** until you open it in the admin or run `npm run validate`. `render.js` still filters URLs with its allow-list.

## Resetting the password

Stop the server, delete `admin/.auth.json`, start it again and open `/admin` to run the first-time setup.
