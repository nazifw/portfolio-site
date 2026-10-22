import { h } from './dom.js';
import { t, getLang, setLang } from './i18n.js';
import { api, setCsrf, ApiError } from './api.js';
import { store } from './store.js';
import { applyErrors } from './fields.js';
import { toast, initTheme, toggleTheme } from './ui.js';
import * as dashboard from './views/dashboard.js';
import * as personal from './views/personal.js';
import * as about from './views/about.js';
import * as projects from './views/projects.js';
import * as blog from './views/blog.js';
import * as gallery from './views/gallery.js';
import * as settings from './views/settings.js';
import * as backups from './views/backups.js';
import * as account from './views/account.js';

const ROUTES = [
  ['dashboard', 'nav.dashboard', dashboard], ['personal', 'nav.personal', personal], ['about', 'nav.about', about],
  ['projects', 'nav.projects', projects], ['blog', 'nav.blog', blog], ['gallery', 'nav.gallery', gallery],
  ['settings', 'nav.settings', settings], ['backups', 'nav.backups', backups], ['account', 'nav.account', account],
];
const SECTION = { site: 'personal', contact: 'personal', socials: 'personal', projects: 'projects', posts: 'blog', gallery: 'gallery', settings: 'settings' };
const PREVIEW_PAGES = [['index.html', 'preview.home'], ['hakkimda.html', 'nav.about'], ['projeler.html', 'nav.projects'], ['blog.html', 'nav.blog'], ['galeri.html', 'nav.gallery'], ['iletisim.html', 'preview.contact']];

const rootEl = document.getElementById('root');
let shell = null;
let saving = false;
let unsubDirty = null;

const sectionFor = (path) => SECTION[/^[a-zA-Z]+/.exec(path)?.[0]] || 'about';
const currentRoute = () => { const n = (location.hash.replace(/^#\/?/, '') || 'dashboard'); return ROUTES.some((r) => r[0] === n) ? n : 'dashboard'; };
export const navigate = (name) => { if (currentRoute() === name) renderRoute(); else location.hash = '#/' + name; };

// ---------------------------------------------------------------- auth screens
function authScreen(mode) {
  rootEl.replaceChildren();
  shell = null;
  const isSetup = mode === 'setup';
  const pw = h('input', { class: 'input', type: 'password', id: 'a-pw', autocomplete: isSetup ? 'new-password' : 'current-password', required: true });
  const pw2 = h('input', { class: 'input', type: 'password', id: 'a-pw2', autocomplete: 'new-password', required: true });
  const err = h('div', { class: 'form-error', role: 'alert' });
  const form = h('form', { class: 'auth-card card', novalidate: true },
    h('div', { class: 'brand brand--big' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }), h('span', { text: t('app.name') })),
    h('h1', { text: isSetup ? t('auth.setup.title') : t('auth.login.title') }),
    h('p', { class: 'muted', text: isSetup ? t('auth.setup.lead') : t('auth.login.lead') }),
    h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'a-pw', text: isSetup ? t('auth.new') : t('auth.password') }), pw, isSetup ? h('div', { class: 'hint', text: t('auth.rules') }) : null),
    isSetup ? h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'a-pw2', text: t('auth.repeat') }), pw2) : null,
    err,
    h('button', { type: 'submit', class: 'btn btn--primary btn--block' }, isSetup ? t('auth.setup.submit') : t('auth.login.submit')));
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); err.textContent = '';
    if (isSetup) {
      if (pw.value.length < 8) { err.textContent = t('err.password_too_short'); pw.focus(); return; }
      if (pw.value !== pw2.value) { err.textContent = t('auth.mismatch'); pw2.focus(); return; }
    }
    try {
      const res = await api('POST', isSetup ? '/setup' : '/login', { password: pw.value });
      setCsrf(res.csrf); pw.value = '';
      await enter();
    } catch (ex) {
      const code = ex instanceof ApiError ? ex.data.error : 'network';
      err.textContent = code === 'too_many_attempts' ? t('err.too_many_attempts', { min: Math.ceil((ex.data.retryAfter || 60) / 60) }) : (t('err.' + code) !== 'err.' + code ? t('err.' + code) : t('common.error'));
      pw.focus();
    }
  });
  const tools = h('div', { class: 'auth-tools' }, langButton(), themeButton());
  rootEl.append(h('main', { class: 'auth-wrap' }, tools, form));
  pw.focus();
}

function langButton() {
  return h('button', { type: 'button', class: 'btn btn--ghost', 'aria-label': t('top.lang'), title: t('top.lang'), onClick: () => setLang(getLang() === 'tr' ? 'en' : 'tr') }, getLang() === 'tr' ? 'EN' : 'TR');
}
function themeButton() {
  return h('button', { type: 'button', class: 'btn btn--ghost', 'aria-label': t('top.theme'), title: t('top.theme'), onClick: toggleTheme }, '◐');
}

// ---------------------------------------------------------------- shell
async function enter() {
  if (!store.content) {
    try {
      const { content } = await api('GET', '/content');
      for (const k of ['projects', 'gallery']) {
        if (Array.isArray(content[k])) content[k] = content[k].map((x, i) => [x, i]).sort((a, b) => (Number(a[0].order) - Number(b[0].order)) || (a[1] - b[1])).map((x) => x[0]);
      }
      store.load(content);
    } catch (_) { toast(t('common.error'), 'error'); return; }
  }
  mountShell();
}

function mountShell() {
  rootEl.replaceChildren();
  const dirtyEl = h('span', { class: 'dirty', role: 'status' });
  const saveBtn = h('button', { type: 'button', class: 'btn btn--primary', onClick: save, title: 'Ctrl+S' }, t('top.save'));
  const prevBtn = h('button', { type: 'button', class: 'btn', 'aria-controls': 'preview', 'aria-expanded': 'false', onClick: () => togglePreview() }, t('top.preview'));
  const nav = h('nav', { class: 'sidebar', 'aria-label': t('nav.label') }, ROUTES.map(([name, key]) => h('a', { href: '#/' + name, 'data-route': name }, t(key))));
  const main = h('main', { id: 'main', class: 'main', tabindex: '-1' });
  const frame = h('iframe', { class: 'preview-frame', title: t('preview.title'), referrerpolicy: 'no-referrer' });
  const pageSel = h('select', { class: 'input input--sm', 'aria-label': t('preview.page'), onChange: () => { frame.src = '/' + pageSel.value; } }, PREVIEW_PAGES.map(([v, k]) => h('option', { value: v, text: t(k) })));
  const aside = h('aside', { id: 'preview', class: 'preview', 'aria-label': t('preview.title') },
    h('div', { class: 'preview-bar' }, h('strong', { text: t('preview.title') }), pageSel,
      h('button', { type: 'button', class: 'btn btn--sm', onClick: () => reloadPreview() }, t('preview.reload')),
      h('a', { class: 'btn btn--sm', href: '/', target: '_blank', rel: 'noopener', onClick: (e) => { e.currentTarget.href = '/' + pageSel.value; } }, t('preview.open'))),
    frame, h('p', { class: 'hint', text: t('preview.hint') }));
  const layout = h('div', { class: 'layout' }, nav, main, aside);
  const top = h('header', { class: 'topbar' },
    h('a', { class: 'brand', href: '#/dashboard' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }), h('span', { text: t('app.name') })),
    h('div', { class: 'topbar-end' }, dirtyEl, prevBtn, langButton(), themeButton(), saveBtn));
  rootEl.append(h('a', { class: 'skip-link', href: '#main', text: t('a11y.skip') }), top, layout);
  shell = { main, nav, dirtyEl, saveBtn, frame, aside, layout, prevBtn, pageSel };

  const updateDirty = () => {
    const d = store.isDirty();
    dirtyEl.textContent = d ? '● ' + t('top.unsaved') : '✓ ' + t('top.saved');
    dirtyEl.classList.toggle('is-dirty', d);
    document.title = (d ? '• ' : '') + t('app.name');
  };
  if (unsubDirty) unsubDirty();
  unsubDirty = store.subscribe(updateDirty);
  updateDirty();
  let open = false;
  try { open = localStorage.getItem('admin.preview') ? localStorage.getItem('admin.preview') === '1' : innerWidth >= 1320; } catch (_) { open = innerWidth >= 1320; }
  setPreview(open);
  renderRoute(false);
}

function setPreview(open) {
  if (!shell) return;
  shell.layout.classList.toggle('has-preview', open);
  shell.prevBtn.setAttribute('aria-expanded', String(open));
  if (open && !shell.frame.getAttribute('src')) shell.frame.src = '/' + shell.pageSel.value;
  try { localStorage.setItem('admin.preview', open ? '1' : '0'); } catch (_) { /* ignore */ }
}
function togglePreview() { setPreview(!shell.layout.classList.contains('has-preview')); }
function reloadPreview() { try { shell.frame.contentWindow.location.reload(); } catch (_) { shell.frame.src = shell.frame.src; } }

function renderRoute(focus = true) {
  if (!shell) return;
  const name = currentRoute();
  const [, key, mod] = ROUTES.find((r) => r[0] === name);
  shell.nav.querySelectorAll('a').forEach((a) => { if (a.dataset.route === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const banner = h('div', { class: 'banner', id: 'err-banner', hidden: true });
  const heading = h('h1', { class: 'view-title', tabindex: '-1', text: t(key) });
  shell.main.replaceChildren(heading, banner, mod.render({ navigate, logout }));
  shell.banner = banner;
  applyErrors();
  if (focus) heading.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

window.addEventListener('errors-applied', (e) => {
  const b = shell && shell.banner; if (!b || !b.isConnected) return;
  const un = e.detail.unmatched;
  b.replaceChildren(); b.hidden = !un.length;
  if (!un.length) return;
  b.append(h('strong', { text: t('err.elsewhere', { n: un.length }) }), h('ul', null, un.slice(0, 8).map((er) => h('li', null,
    h('button', { type: 'button', class: 'link', onClick: () => goTo(er.path) }, er.path), ' - ' + er.message))));
});

function goTo(path) {
  const m = /^(projects|posts)\[(\d+)\]/.exec(path);
  if (m) store.ui.selected[m[1]] = Number(m[2]);
  navigate(sectionFor(path));
}

// ---------------------------------------------------------------- save
async function save() {
  if (saving || !store.content) return;
  saving = true;
  shell && shell.saveBtn.setAttribute('disabled', '');
  try {
    const r = await api('PUT', '/content', store.content);
    store.errors = [];
    store.markSaved();
    applyErrors();
    toast(r.unchanged ? t('save.unchanged') : t('save.ok'), 'success');
    if (shell) reloadPreview();
    window.dispatchEvent(new CustomEvent('content-saved'));
  } catch (e) {
    if (e instanceof ApiError && e.status === 422 && e.data.errors) {
      store.errors = e.data.errors;
      const un = applyErrors();
      toast(t('save.invalid', { n: e.data.errors.length }), 'error');
      if (un.length === e.data.errors.length) goTo(e.data.errors[0].path);
    } else if (!(e instanceof ApiError && e.status === 401)) toast(t('save.failed'), 'error');
  } finally {
    saving = false;
    shell && shell.saveBtn.removeAttribute('disabled');
  }
}

async function logout() {
  try { await api('POST', '/logout', {}); } catch (_) { /* ignore */ }
  store.content = null; store.savedStr = '';
  setCsrf(null);
  await boot();
}

// ---------------------------------------------------------------- global handlers
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && shell) { e.preventDefault(); save(); }
});
window.addEventListener('beforeunload', (e) => { if (store.isDirty()) { e.preventDefault(); e.returnValue = ''; } });
window.addEventListener('hashchange', () => renderRoute());
window.addEventListener('admin-lang', () => { if (shell) mountShell(); else boot(); });
window.addEventListener('auth-lost', () => { if (shell) { toast(t('auth.expired'), 'error'); authScreen('login'); } });

async function boot() {
  initTheme();
  try {
    const s = await api('GET', '/session');
    if (s.csrf) setCsrf(s.csrf);
    if (!s.configured) authScreen('setup');
    else if (!s.authenticated) authScreen('login');
    else await enter();
  } catch (_) {
    rootEl.replaceChildren(h('main', { class: 'auth-wrap' }, h('div', { class: 'card auth-card' }, h('h1', { text: t('common.error') }), h('p', { text: t('err.network') }))));
  }
}
boot();
