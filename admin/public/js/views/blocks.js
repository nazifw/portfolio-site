// Block editor (blog posts + "principles" section): heading / paragraph / image / code / quote / list
import { h } from '../dom.js';
import { t } from '../i18n.js';
import { store } from '../store.js';
import { S, renderSpec, listEditor, loc, toggle, field, text, select, image } from '../fields.js';

const TYPES = ['paragraph', 'heading', 'image', 'code', 'quote', 'list'];

function blank(type) {
  const L = () => ({ tr: '', en: '' });
  switch (type) {
    case 'heading': return { type, level: 2, text: L() };
    case 'paragraph': return { type, text: L() };
    case 'image': return { type, src: '', alt: L(), caption: L() };
    case 'code': return { type, language: '', code: '' };
    case 'quote': return { type, text: L(), cite: L() };
    case 'list': return { type, ordered: false, items: [L()] };
    default: return { type };
  }
}

function blockBody(p, b) {
  switch (b.type) {
    case 'heading': return h('div', { class: 'form-grid' },
      field(t('blk.level'), select([...p, 'level'], [[2, 'H2'], [3, 'H3']], { number: true, default: 2 }), { path: [...p, 'level'] }),
      loc([...p, 'text'], t('f.text'), { required: true }));
    case 'paragraph': return h('div', null, loc([...p, 'text'], t('f.text'), { required: true, area: true, rows: 5 }), toggle([...p, 'lead'], t('blk.lead')));
    case 'image': return h('div', { class: 'form-grid' }, image([...p, 'src'], t('blk.image'), { required: true }),
      h('div', null, loc([...p, 'alt'], t('f.alt')), loc([...p, 'caption'], t('f.caption'), { optional: true })));
    case 'code': return h('div', null,
      field(t('blk.language'), text([...p, 'language'], { max: 40, placeholder: 'js, bash, css...' }), { path: [...p, 'language'] }),
      field(t('blk.code'), text([...p, 'code'], { multiline: true, rows: 8, mono: true, spellcheck: false }), { path: [...p, 'code'] }));
    case 'quote': return h('div', null, loc([...p, 'text'], t('f.text'), { required: true, area: true }), loc([...p, 'cite'], t('blk.cite'), { optional: true }));
    case 'list': return h('div', null, toggle([...p, 'ordered'], t('blk.ordered')),
      listEditor({
        path: [...p, 'items'], addLabel: t('blk.item.add'), noConfirm: true, emptyText: t('blk.item.empty'),
        title: (it, i) => (it && it.tr) || t('blk.item', { n: i + 1 }), newItem: () => ({ tr: '', en: '' }),
        renderItem: (ip) => loc(ip, t('f.text'), { required: true }),
      }));
    default: return h('p', { class: 'muted', text: t('blk.unknown') });
  }
}

export function blockEditor(path) {
  const root = h('div', { class: 'blocks' });
  const palette = h('div', { class: 'palette', role: 'group', 'aria-label': t('blk.add') }, h('span', { class: 'muted', text: t('blk.add') }),
    TYPES.map((type) => h('button', { type: 'button', class: 'btn', onClick: () => {
      const arr = store.get(path) || [];
      store.insert(path, arr.length, blank(type));
      build();
      const cards = root.querySelectorAll('.cards > .item-card'); const last = cards[cards.length - 1];
      if (last) { const f = last.querySelector('input,textarea,select'); if (f) f.focus(); last.scrollIntoView({ block: 'center' }); }
    } }, '+ ' + t('blk.type.' + type))));
  function build() {
    const list = listEditor({
      path, addLabel: '', noConfirm: false, emptyText: t('blk.empty'),
      title: (b, i) => (i + 1) + '. ' + t('blk.type.' + (b && b.type)) + (b && b.text && b.text.tr ? ' - ' + b.text.tr.slice(0, 50) : ''),
      newItem: () => blank('paragraph'),
      renderItem: (p, i, b) => blockBody(p, b),
    });
    list.querySelector(':scope > .btn-row').remove(); // typed palette replaces the generic add button
    root.replaceChildren(list, palette);
  }
  build();
  return root;
}
