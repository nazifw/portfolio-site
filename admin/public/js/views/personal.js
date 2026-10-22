import { h } from '../dom.js';
import { t } from '../i18n.js';
import { store, nextId } from '../store.js';
import { S, renderSpec, listEditor, field, text, select } from '../fields.js';

const ICONS = ['github', 'linkedin', 'mail', 'x', 'instagram', 'youtube', 'link'].map((v) => [v, v]);

export function render() {
  const root = h('div', { class: 'view' });
  root.append(
    h('section', { class: 'card' }, h('h2', { text: t('personal.site') }),
      renderSpec(['site'], [
        S.loc('name', 'f.name', { required: true, max: 80 }), S.loc('role', 'f.role'),
        S.loc('tagline', 'f.tagline', { area: true, wide: true }), S.loc('university', 'f.university'),
        S.loc('department', 'f.department'), S.loc('year', 'f.year'), S.loc('city', 'f.city'),
        S.image('avatar', 'f.avatar', { hint: 'f.avatar.hint' }), S.loc('avatarAlt', 'f.avatarAlt'), S.loc('avatarCaption', 'f.avatarCaption'),
      ])),
    h('section', { class: 'card' }, h('h2', { text: t('personal.contact') }),
      renderSpec(['contact'], [
        S.text('email', 'f.email', { input: 'email' }), S.text('phone', 'f.phone', { input: 'tel' }),
        S.loc('address', 'f.address'), S.loc('responseTime', 'f.responseTime'),
        S.text('mapUrl', 'f.mapUrl', { input: 'url', placeholder: 'https://', wide: true, hint: 'f.url.hint' }),
      ])),
    h('section', { class: 'card' }, h('h2', { text: t('personal.socials') }), h('p', { class: 'muted', text: t('personal.socials.hint') }),
      listEditor({
        path: ['socials'], addLabel: t('personal.socials.add'), emptyText: t('personal.socials.empty'), noConfirm: false,
        title: (it, i) => (it && it.label && it.label.tr) || t('personal.socials.item', { n: i + 1 }),
        newItem: (list) => ({ id: nextId('social', list), label: { tr: '', en: '' }, url: '', icon: 'link' }),
        renderItem: (p) => h('div', { class: 'form-grid' },
          renderSpec(p, [S.loc('label', 'f.label', { required: true, max: 80 })]),
          field(t('f.icon'), select([...p, 'icon'], ICONS, { default: 'link' }), { path: [...p, 'icon'] }),
          field(t('f.url'), text([...p, 'url'], { type: 'url', placeholder: 'https://, mailto:, tel:' }), { path: [...p, 'url'], required: true, hint: t('f.url.hint2'), class: 'span-2' })),
      })));
  return root;
}
