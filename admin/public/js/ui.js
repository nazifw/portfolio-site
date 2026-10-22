import { h, fmtBytes } from './dom.js';
import { t } from './i18n.js';
import { api, ApiError } from './api.js';

// ---------- toast ----------
export function toast(message, kind = 'info') {
  const host = document.getElementById('toasts');
  if (!host) return;
  const el = h('div', { class: 'toast toast--' + kind, role: kind === 'error' ? 'alert' : 'status' }, message);
  host.append(el);
  setTimeout(() => el.remove(), kind === 'error' ? 7000 : 3500);
}

// ---------- modal built on <dialog> (focus trap + Esc + focus restore for free) ----------
export function modal({ title, body, actions, wide }) {
  return new Promise((resolve) => {
    const dlg = h('dialog', { class: 'modal' + (wide ? ' modal--wide' : ''), 'aria-labelledby': 'modal-title' });
    const head = h('div', { class: 'modal-head' },
      h('h2', { id: 'modal-title', text: title }),
      h('button', { type: 'button', class: 'btn btn--ghost btn--icon', 'aria-label': t('common.close'), onClick: () => dlg.close('cancel') }, '×'));
    const foot = actions ? h('div', { class: 'modal-foot' }, actions(dlg)) : null;
    dlg.append(head, h('div', { class: 'modal-body' }, body), foot);
    dlg.addEventListener('close', () => { const v = dlg.returnValue; dlg.remove(); resolve(v); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close('cancel'); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

export async function confirmDialog({ title, message, confirmText, danger }) {
  const v = await modal({
    title: title || t('common.confirm'),
    body: h('p', { text: message }),
    actions: (dlg) => [
      h('button', { type: 'button', class: 'btn', onClick: () => dlg.close('cancel') }, t('common.cancel')),
      h('button', { type: 'button', class: 'btn ' + (danger ? 'btn--danger' : 'btn--primary'), autofocus: true, onClick: () => dlg.close('ok') }, confirmText || t('common.ok')),
    ],
  });
  return v === 'ok';
}

// ---------- uploads ----------
export async function uploadFiles(fileList) {
  const files = [...fileList];
  const uploaded = [];
  for (let i = 0; i < files.length; i += 20) {
    const fd = new FormData();
    const batch = files.slice(i, i + 20);
    const tooBig = batch.filter((f) => f.size > 5 * 1024 * 1024);
    tooBig.forEach((f) => toast(t('up.reason.too_large', { name: f.name }), 'error'));
    batch.filter((f) => f.size <= 5 * 1024 * 1024).forEach((f) => fd.append('files', f, f.name));
    if (![...fd.keys()].length) continue;
    try {
      const res = await api('POST', '/upload', fd);
      uploaded.push(...res.uploaded);
      res.rejected.forEach((r) => toast(t('up.reason.' + r.reason, { name: r.original }), 'error'));
    } catch (e) {
      if (e instanceof ApiError && e.data && e.data.rejected) e.data.rejected.forEach((r) => toast(t('up.reason.' + r.reason, { name: r.original }), 'error'));
      else toast(t('up.failed'), 'error');
    }
  }
  if (uploaded.length) toast(t('up.done', { n: uploaded.length }), 'success');
  return uploaded;
}

export function dropZone(onFiles, { multiple = true, label } = {}) {
  const input = h('input', { type: 'file', class: 'sr-only', accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif', multiple, tabindex: '-1' });
  const zone = h('div', { class: 'dropzone', role: 'button', tabindex: '0', 'aria-label': label || t('up.drop') },
    h('strong', { text: label || t('up.drop') }), h('span', { class: 'muted', text: t('up.hint') }), input);
  const pick = () => input.click();
  zone.addEventListener('click', (e) => { if (e.target !== input) pick(); });
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  input.addEventListener('change', () => { if (input.files.length) onFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { e.preventDefault(); zone.classList.add('is-over'); } }));
  ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, () => zone.classList.remove('is-over')));
  zone.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); onFiles(e.dataTransfer.files); } });
  return zone;
}

// ---------- image library (choose existing or upload) -> resolves with "img/..." path or null ----------
export async function imageLibrary() {
  let chosen = null;
  const grid = h('div', { class: 'lib-grid' });
  const body = h('div', null);
  let dlgRef = null;
  const pick = (p) => { chosen = p; dlgRef.close('ok'); };
  async function refresh() {
    grid.replaceChildren();
    try {
      const { images } = await api('GET', '/images');
      if (!images.length) grid.append(h('p', { class: 'empty', text: t('lib.empty') }));
      images.forEach((im) => grid.append(h('button', { type: 'button', class: 'lib-item', 'aria-label': im.path, onClick: () => pick(im.path) },
        h('img', { src: '/' + im.path, alt: '', loading: 'lazy' }), h('span', { text: im.name }), h('small', { class: 'muted', text: fmtBytes(im.size) }))));
    } catch (_) { grid.append(h('p', { class: 'empty', text: t('common.error') })); }
  }
  body.append(dropZone(async (files) => { const up = await uploadFiles(files); if (up.length) pick(up[0].path); }, { multiple: true }), grid);
  const p = modal({
    title: t('lib.title'), body, wide: true,
    actions: (dlg) => { dlgRef = dlg; return [h('button', { type: 'button', class: 'btn', onClick: () => dlg.close('cancel') }, t('common.cancel'))]; },
  });
  refresh();
  await p;
  return chosen;
}

// ---------- theme ----------
export function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('admin.theme'); } catch (_) { /* ignore */ }
  const theme = saved === 'light' || saved === 'dark' ? saved : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.dataset.theme = theme;
}
export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('admin.theme', next); } catch (_) { /* ignore */ }
}
