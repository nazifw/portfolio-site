import { h } from '../dom.js';
import { t } from '../i18n.js';
import { api, ApiError } from '../api.js';
import { toast } from '../ui.js';

export function render({ logout }) {
  const root = h('div', { class: 'view' });
  const cur = h('input', { class: 'input', type: 'password', id: 'pw-cur', autocomplete: 'current-password', required: true });
  const nxt = h('input', { class: 'input', type: 'password', id: 'pw-new', autocomplete: 'new-password', minlength: 8, required: true });
  const rep = h('input', { class: 'input', type: 'password', id: 'pw-rep', autocomplete: 'new-password', minlength: 8, required: true });
  const err = h('div', { class: 'form-error', role: 'alert' });
  const form = h('form', { class: 'card narrow', novalidate: true },
    h('h2', { text: t('account.password') }),
    h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'pw-cur', text: t('auth.current') }), cur),
    h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'pw-new', text: t('auth.new') }), nxt, h('div', { class: 'hint', text: t('auth.rules') })),
    h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'pw-rep', text: t('auth.repeat') }), rep),
    err, h('div', { class: 'btn-row' }, h('button', { type: 'submit', class: 'btn btn--primary' }, t('account.change'))));
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); err.textContent = '';
    if (nxt.value.length < 8) { err.textContent = t('err.password_too_short'); nxt.focus(); return; }
    if (nxt.value !== rep.value) { err.textContent = t('auth.mismatch'); rep.focus(); return; }
    try {
      await api('POST', '/password', { current: cur.value, next: nxt.value });
      cur.value = nxt.value = rep.value = '';
      toast(t('account.changed'), 'success');
    } catch (ex) {
      const code = ex instanceof ApiError ? ex.data.error : 'network';
      err.textContent = t('err.' + code) === 'err.' + code ? t('common.error') : t('err.' + code);
    }
  });
  root.append(form,
    h('section', { class: 'card narrow' }, h('h2', { text: t('account.session') }), h('p', { class: 'muted', text: t('account.session.hint') }),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn', onClick: logout }, t('account.logout')))),
    h('section', { class: 'card narrow' }, h('h2', { text: t('account.reset') }), h('p', { class: 'muted', text: t('account.reset.hint') })));
  return root;
}
