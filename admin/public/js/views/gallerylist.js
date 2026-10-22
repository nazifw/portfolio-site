import { h } from '../dom.js';
import { t } from '../i18n.js';
import { store, nextId } from '../store.js';
import { listEditor, renderSpec, S } from '../fields.js';

// Gallery cards (sortable by drag or buttons); `order` is renumbered from array position on every change.
export function listEditorLike() {
  const renumber = () => (store.get(['gallery']) || []).forEach((g, i) => { g.order = i + 1; });
  const ed = listEditor({
    path: ['gallery'], onChange: renumber, addLabel: t('gallery.add'), emptyText: t('gallery.empty'),
    title: (g, i) => (g && g.title && g.title.tr) || (g && g.image ? g.image.split('/').pop() : t('gallery.item', { n: i + 1 })),
    newItem: (list) => ({ id: nextId('gal', list), image: '', title: { tr: '', en: '' }, alt: { tr: '', en: '' }, caption: { tr: '', en: '' }, order: list.length + 1, visible: true }),
    renderItem: (p) => renderSpec(p, [
      S.image('image', 'f.image', { required: true, hint: 'gallery.image.hint', wide: true }),
      S.loc('title', 'f.title'), S.loc('alt', 'f.alt'), S.loc('caption', 'f.caption', { area: true, rows: 2 }), S.loc('group', 'f.group', { hint: 'f.group.hint' }),
      S.bool('visible', 'f.visible', { default: true }),
    ]),
  });
  return ed;
}
export { h };
