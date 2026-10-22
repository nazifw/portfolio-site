import { h, fmtBytes } from '../dom.js';
import { t, fmtDate } from '../i18n.js';
import { store } from '../store.js';
import { api, ApiError } from '../api.js';
import { toast, confirmDialog } from '../ui.js';

export function render() {
  const root = h('div', { class: 'view' });
  const box = h('div', { class: 'card' });
  root.append(h('p', { class: 'muted view-lead', text: t('backups.lead') }), box);

  async function draw() {
    box.replaceChildren(h('p', { class: 'muted', text: t('common.loading') }));
    let backups = [];
    try { backups = (await api('GET', '/backups')).backups; } catch (_) { box.replaceChildren(h('p', { class: 'empty', text: t('common.error') })); return; }
    box.replaceChildren();
    if (!backups.length) { box.append(h('p', { class: 'empty', text: t('backups.empty') })); return; }
    const table = h('table', { class: 'table' },
      h('thead', null, h('tr', null, h('th', { scope: 'col', text: t('backups.date') }), h('th', { scope: 'col', text: t('backups.file') }), h('th', { scope: 'col', text: t('backups.size') }), h('th', { scope: 'col' }, h('span', { class: 'sr-only', text: t('backups.actions') })))),
      h('tbody', null, backups.map((b) => h('tr', null,
        h('td', { text: fmtDate(b.mtime) }), h('td', { class: 'mono', text: b.name }), h('td', { text: fmtBytes(b.size) }),
        h('td', { class: 'actions' }, h('button', { type: 'button', class: 'btn', onClick: () => restore(b.name) }, t('backups.restore')))))));
    box.append(h('div', { class: 'table-wrap' }, table));
  }

  async function restore(name) {
    const msg = t('backups.confirm', { name }) + (store.isDirty() ? ' ' + t('backups.confirmDirty') : '');
    if (!(await confirmDialog({ message: msg, confirmText: t('backups.restore'), danger: true }))) return;
    try {
      await api('POST', '/backups/restore', { name });
      const { content } = await api('GET', '/content');
      store.load(content);
      window.dispatchEvent(new CustomEvent('content-saved'));
      toast(t('backups.restored'), 'success');
      draw();
    } catch (e) {
      if (e instanceof ApiError && e.data && e.data.error === 'validation_failed') {
        const first = e.data.errors.slice(0, 3).map((x) => x.path + ': ' + x.message).join('; ');
        if (await confirmDialog({ message: t('backups.invalid') + ' ' + first, confirmText: t('backups.forceRestore'), danger: true })) {
          try {
            await api('POST', '/backups/restore', { name, force: true });
            store.load((await api('GET', '/content')).content);
            window.dispatchEvent(new CustomEvent('content-saved'));
            toast(t('backups.restored'), 'success'); draw();
          } catch (_) { toast(t('common.error'), 'error'); }
        }
      } else toast(t('common.error'), 'error');
    }
  }
  draw();
  return root;
}
