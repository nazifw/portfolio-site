import { h } from '../dom.js';
import { t } from '../i18n.js';
import { store } from '../store.js';
import { S, renderSpec, field, text } from '../fields.js';

export function render() {
  const root = h('div', { class: 'view' });
  const accentPath = ['settings', 'accentOverride'];
  const hex = h('input', { type: 'color', class: 'color-input', 'aria-label': t('settings.accent.pick') });
  const txt = text(accentPath, { max: 60, placeholder: '#e9a47e', spellcheck: false });
  const swatch = (v) => /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#e9a47e';
  hex.value = swatch(txt.value);
  hex.addEventListener('input', () => { txt.value = hex.value; txt.dispatchEvent(new Event('input')); });
  txt.addEventListener('input', () => { hex.value = swatch(txt.value); });
  const reset = h('button', { type: 'button', class: 'btn btn--ghost', onClick: () => { txt.value = ''; txt.dispatchEvent(new Event('input')); } }, t('settings.accent.reset'));
  root.append(
    h('section', { class: 'card' }, h('h2', { text: t('settings.general') }),
      renderSpec(['settings'], [
        S.select('defaultLang', 'settings.defaultLang', [['tr', 'Türkçe'], ['en', 'English']], { default: 'tr' }),
        S.select('defaultTheme', 'settings.defaultTheme', [['system', 'settings.theme.system'], ['dark', 'settings.theme.dark'], ['light', 'settings.theme.light']], { default: 'system' }),
        S.bool('fire', 'settings.fire', { default: true, hint: 'settings.fire.hint' }), S.bool('cursor', 'settings.cursor', { default: true, hint: 'settings.cursor.hint' }),
      ]),
      field(t('settings.accent'), h('div', { class: 'accent-row' }, hex, txt, reset), { path: accentPath, hint: t('settings.accent.hint') })),
    h('section', { class: 'card' }, h('h2', { text: t('settings.seo') }),
      renderSpec(['settings'], [
        S.loc('siteTitle', 'settings.siteTitle', { keep: true }), S.loc('siteDescription', 'settings.siteDescription', { area: true, keep: true }),
        S.text('githubUsername', 'settings.github', { hint: 'settings.github.hint' }),
      ])));
  void store;
  return root;
}
