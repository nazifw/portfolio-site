import { h, slugify } from '../dom.js';
import { t, fmtDate } from '../i18n.js';
import { store, nextId } from '../store.js';
import { field, text, loc, chips, image, toggle, number } from '../fields.js';
import { masterDetail } from './master.js';
import { blockEditor } from './blocks.js';

const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

export function render() {
  const root = h('div', { class: 'view' });
  root.append(h('p', { class: 'muted view-lead', text: t('blog.lead') }));
  root.append(masterDetail({
    key: 'posts', path: ['posts'], listLabel: t('nav.blog'), addLabel: t('blog.add'), emptyText: t('blog.empty'),
    row: (p) => ({ title: p.title && p.title.tr, sub: p.date || '', thumb: p.cover, badge: p.visible === false ? t('f.hidden') : null, badgeKind: 'plain', hidden: p.visible === false }),
    formTitle: (p) => (p.title && p.title.tr) || t('blog.new'),
    newItem: (list) => ({
      id: nextId('post', list), slug: '', title: { tr: '', en: '' }, excerpt: { tr: '', en: '' }, cover: '', coverAlt: { tr: '', en: '' },
      date: today(), tags: [], visible: true, blocks: [{ type: 'paragraph', lead: true, text: { tr: '', en: '' } }],
    }),
    renderForm: (p, item) => {
      const slugEl = text([...p, 'slug'], { max: 80, mono: true, spellcheck: false });
      let auto = !item.slug || item.slug === slugify(item.title && item.title.tr);
      slugEl.addEventListener('input', () => { auto = false; });
      const savedSlug = (store.saved() && store.get([...p, 'slug'], store.saved())) || '';
      const slugWarn = h('p', { class: 'hint hint--warn', text: t('blog.slug.warn') });
      slugWarn.hidden = !savedSlug || slugEl.value === savedSlug;
      slugEl.addEventListener('input', () => { slugWarn.hidden = !savedSlug || slugEl.value === savedSlug; });
      const dateEl = text([...p, 'date'], { type: 'date' });
      return h('div', null,
        h('div', { class: 'card' }, h('h3', { text: t('blog.meta') }), h('div', { class: 'form-grid' },
          loc([...p, 'title'], t('f.title'), { required: true, max: 300, onTr: (v) => { if (auto) { slugEl.value = slugify(v); store.set([...p, 'slug'], slugEl.value); } } }),
          h('div', null, field(t('f.slug'), slugEl, { path: [...p, 'slug'], required: true, hint: t('f.slug.hint') }), slugWarn),
          loc([...p, 'excerpt'], t('f.excerpt'), { required: true, area: true, max: 1000 }),
          h('div', null,
            field(t('f.date'), dateEl, { path: [...p, 'date'], required: true }),
            field(t('f.readMinutes'), number([...p, 'readMinutes'], { min: 1, max: 600, optional: true }), { path: [...p, 'readMinutes'], hint: t('f.readMinutes.hint') })),
          image([...p, 'cover'], t('f.cover'), { required: true, hint: t('blog.cover.hint') }),
          h('div', null, loc([...p, 'coverAlt'], t('f.alt'), { optional: true }), loc([...p, 'coverCaption'], t('f.caption'), { optional: true })),
          chips([...p, 'tags'], t('f.tags'), { hint: t('f.tags.hint') }),
          toggle([...p, 'visible'], t('f.visible'), { default: true }))),
        h('div', { class: 'card' }, h('h3', { text: t('blog.content') }), blockEditor([...p, 'blocks'])));
    },
  }));
  return root;
}
