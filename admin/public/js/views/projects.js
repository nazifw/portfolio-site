import { h, slugify } from '../dom.js';
import { t } from '../i18n.js';
import { store, nextId } from '../store.js';
import { S, renderSpec, field, text, loc, chips, image, toggle, select, number } from '../fields.js';
import { masterDetail } from './master.js';

const STATUS = [['done', 'status.done'], ['wip', 'status.wip'], ['planned', 'status.planned']];

export function render() {
  const root = h('div', { class: 'view' });
  root.append(h('p', { class: 'muted view-lead', text: t('projects.lead') }));
  root.append(masterDetail({
    key: 'projects', path: ['projects'], listLabel: t('nav.projects'), addLabel: t('projects.add'), emptyText: t('projects.empty'),
    afterMove: (list) => list.forEach((p, i) => { p.order = i + 1; }),
    row: (p) => ({ title: p.title && p.title.tr, sub: p.slug, thumb: p.image, badge: t('status.' + p.status), badgeKind: p.status, hidden: p.visible === false }),
    formTitle: (p) => (p.title && p.title.tr) || t('projects.new'),
    newItem: (list) => ({
      id: nextId('proj', list), slug: '', title: { tr: '', en: '' }, summary: { tr: '', en: '' }, description: { tr: '', en: '' },
      image: '', imageAlt: { tr: '', en: '' }, tags: [], status: 'wip', links: {}, featured: false, order: list.length + 1, visible: true,
    }),
    renderForm: (p, item) => {
      const slugEl = text([...p, 'slug'], { max: 80, mono: true, spellcheck: false });
      let auto = !item.slug || item.slug === slugify(item.title && item.title.tr);
      slugEl.addEventListener('input', () => { auto = false; });
      const savedSlug = (store.saved() && store.get([...p, 'slug'], store.saved())) || '';
      return h('div', { class: 'card' },
        h('div', { class: 'form-grid' },
          loc([...p, 'title'], t('f.title'), { required: true, max: 200, onTr: (v) => { if (auto) { slugEl.value = slugify(v); store.set([...p, 'slug'], slugEl.value); } } }),
          field(t('f.slug'), slugEl, { path: [...p, 'slug'], required: true, hint: t('f.slug.hint') }),
          loc([...p, 'summary'], t('f.summary'), { required: true, area: true, max: 1000, class: 'span-2' }),
          loc([...p, 'description'], t('f.description'), { area: true, rows: 5, optional: true }),
          image([...p, 'image'], t('f.cover'), { required: true, hint: t('projects.image.hint') }),
          loc([...p, 'imageAlt'], t('f.alt'), { optional: true }),
          loc([...p, 'meta'], t('f.meta'), { optional: true, hint: t('f.meta.hint') }),
          chips([...p, 'tags'], t('f.tags'), { hint: t('f.tags.hint') }),
          field(t('f.status'), select([...p, 'status'], STATUS.map(([v, k]) => [v, t(k)]), { default: 'wip' }), { path: [...p, 'status'] }),
          field('GitHub', text([...p, 'links', 'github'], { type: 'url', placeholder: 'https://github.com/...' }), { path: [...p, 'links', 'github'], hint: t('f.url.http') }),
          field('Demo', text([...p, 'links', 'demo'], { type: 'url', placeholder: 'https://' }), { path: [...p, 'links', 'demo'], hint: t('f.url.http') }),
          toggle([...p, 'featured'], t('f.featured'), { hint: t('f.featured.hint') }),
          toggle([...p, 'visible'], t('f.visible'), { default: true })),
        savedSlug ? h('p', { class: 'hint', text: t('projects.slug.warn', { slug: savedSlug }) }) : null);
    },
  }));
  return root;
}
