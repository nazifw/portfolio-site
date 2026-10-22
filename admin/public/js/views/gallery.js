import { h } from '../dom.js';
import { t } from '../i18n.js';
import { store, nextId } from '../store.js';
import { listEditorLike } from './gallerylist.js';
import { dropZone, uploadFiles } from '../ui.js';

export function render() {
  const root = h('div', { class: 'view' });
  root.append(h('p', { class: 'muted view-lead', text: t('gallery.lead') }));
  const listHost = h('div');
  const zone = dropZone(async (files) => {
    const up = await uploadFiles(files);
    up.forEach((u) => {
      const cur = store.get(['gallery']) || [];
      const stem = u.name.replace(/\.[a-z0-9]+$/, '').replace(/-[0-9a-f]{6}$/, '').replace(/-/g, ' ');
      store.insert(['gallery'], cur.length, {
        id: nextId('gal', cur), image: u.path, title: { tr: stem, en: stem }, alt: { tr: '', en: '' }, caption: { tr: '', en: '' },
        order: cur.length + 1, visible: true,
      });
    });
    if (up.length) listHost.replaceChildren(listEditorLike());
  }, { multiple: true, label: t('gallery.drop') });
  root.append(h('section', { class: 'card' }, zone), listHost);
  listHost.append(listEditorLike());
  return root;
}
