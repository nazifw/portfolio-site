import { h } from '../dom.js';
import { t, fmtDate } from '../i18n.js';
import { store } from '../store.js';
import { api } from '../api.js';
import { toast } from '../ui.js';

const stat = (n, label, href) => h('a', { class: 'stat', href }, h('strong', { text: String(n) }), h('span', { text: label }));

export function render({ navigate }) {
  const c = store.content || {};
  const root = h('div', { class: 'view' });
  const backupLine = h('span', { class: 'muted', text: t('common.loading') });
  api('GET', '/backups').then(({ backups }) => { backupLine.textContent = backups.length ? fmtDate(backups[0].mtime) + ' (' + backups.length + ')' : t('dash.noBackup'); }).catch(() => { backupLine.textContent = '-'; });

  const checkOut = h('div', { class: 'check-out', 'aria-live': 'polite' });
  const check = h('button', { type: 'button', class: 'btn', onClick: async () => {
    try {
      const { errors } = await api('POST', '/validate', store.content);
      checkOut.replaceChildren(errors.length
        ? h('ul', { class: 'err-list' }, errors.slice(0, 12).map((e) => h('li', null, h('code', { text: e.path }), ' ', e.message)))
        : h('p', { class: 'ok-text', text: t('dash.valid') }));
    } catch (_) { toast(t('common.error'), 'error'); }
  } }, t('dash.check'));

  root.append(
    h('div', { class: 'stats' },
      stat((c.projects || []).filter((p) => p.visible !== false).length + '/' + (c.projects || []).length, t('nav.projects'), '#/projects'),
      stat((c.posts || []).length, t('nav.blog'), '#/blog'),
      stat((c.gallery || []).length, t('nav.gallery'), '#/gallery'),
      stat((c.skills || []).length, t('about.skills'), '#/about')),
    h('section', { class: 'card' }, h('h2', { text: t('dash.status') }),
      h('dl', { class: 'dl' }, h('dt', { text: t('dash.lastBackup') }), h('dd', null, backupLine),
        h('dt', { text: t('dash.unsaved') }), h('dd', { text: store.isDirty() ? t('common.yes') : t('common.no') })),
      h('div', { class: 'btn-row' }, check), checkOut),
    h('section', { class: 'card' }, h('h2', { text: t('dash.quick') }),
      h('div', { class: 'btn-row wrap' },
        h('button', { type: 'button', class: 'btn', onClick: () => { store.ui.selected.projects = (c.projects || []).length; navigate('projects'); } }, '+ ' + t('projects.add')),
        h('button', { type: 'button', class: 'btn', onClick: () => navigate('blog') }, '+ ' + t('blog.add')),
        h('button', { type: 'button', class: 'btn', onClick: () => navigate('gallery') }, t('gallery.upload')),
        h('a', { class: 'btn', href: '/', target: '_blank', rel: 'noopener' }, t('preview.open')))),
    h('section', { class: 'card' }, h('h2', { text: t('preview.title') }), h('p', { class: 'muted', text: t('preview.hint') }), h('p', { class: 'muted', text: t('dash.previewSide') })));
  return root;
}
