// Reusable, store-bound form controls. Every control reads/writes store.content via a path array.
import { h, fmtBytes } from './dom.js';
import { t } from './i18n.js';
import { store, pstr } from './store.js';
import { confirmDialog, imageLibrary } from './ui.js';

let uid = 0;
const nid = (p) => p + '-' + (++uid);

// ---------- error display ----------
const ERR_MAP = [
  [/^required$/, 'err.required'], [/^duplicate id/, 'err.dupId'], [/^duplicate slug/, 'err.dupSlug'],
  [/^invalid slug/, 'err.slug'], [/^must be an integer 0-100/, 'err.percent'], [/^file not found/, 'err.fileMissing'],
  [/^must be YYYY-MM-DD/, 'err.date'],
];
export function errText(e) {
  for (const [re, key] of ERR_MAP) if (re.test(e.message)) return t(key);
  return e.message;
}

export function errSlot(ps, input) {
  const slot = h('div', { class: 'field-error', 'data-err': ps, id: nid('err') });
  if (input) { input.setAttribute('aria-describedby', slot.id); slot.dataset.input = ''; slot._input = input; }
  return slot;
}

export function applyErrors() {
  const slots = [...document.querySelectorAll('[data-err]')];
  slots.forEach((s) => {
    s.textContent = '';
    if (s._input) s._input.removeAttribute('aria-invalid');
    const f = s.closest('.field'); if (f) f.classList.remove('has-error');
  });
  const byPath = new Map(slots.map((s) => [s.dataset.err, s]));
  const unmatched = [];
  for (const e of store.errors) {
    const s = byPath.get(e.path);
    if (!s) { unmatched.push(e); continue; }
    s.textContent = (s.textContent ? s.textContent + '; ' : '') + errText(e);
    if (s._input) s._input.setAttribute('aria-invalid', 'true');
    const f = s.closest('.field'); if (f) f.classList.add('has-error');
  }
  window.dispatchEvent(new CustomEvent('errors-applied', { detail: { unmatched } }));
  return unmatched;
}

function touched(path) {
  const ps = pstr(path);
  const had = store.errors.length;
  store.errors = store.errors.filter((e) => e.path !== ps && !e.path.startsWith(ps + '.'));
  if (had !== store.errors.length) applyErrors();
}

// ---------- field wrapper ----------
export function field(label, control, o = {}) {
  const tag = control.tagName;
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  const lid = nid('lbl');
  const wrap = h('div', { class: 'field' + (o.class ? ' ' + o.class : ''), role: isInput ? null : 'group', 'aria-labelledby': isInput ? null : lid });
  if (isInput && !control.id) control.id = nid('in');
  wrap.append(h('label', { id: lid, class: 'field-label', for: isInput ? control.id : null }, label, o.required ? h('span', { class: 'req', 'aria-hidden': 'true', text: ' *' }) : null));
  wrap.append(control);
  if (o.hint) wrap.append(h('div', { class: 'hint', text: o.hint }));
  if (o.path && !o.noErr) wrap.append(errSlot(pstr(o.path), isInput ? control : null));
  return wrap;
}

// ---------- primitive controls ----------
export function text(path, o = {}) {
  const el = h(o.multiline ? 'textarea' : 'input', { class: 'input' + (o.mono ? ' mono' : ''), type: o.multiline ? null : (o.type || 'text'), rows: o.multiline ? (o.rows || 3) : null, maxlength: o.max, placeholder: o.placeholder, autocomplete: 'off', spellcheck: o.spellcheck === false ? 'false' : null });
  const cur = store.get(path);
  el.value = typeof cur === 'string' ? cur : '';
  el.addEventListener('input', () => {
    if (o.optional && el.value === '' && cur === undefined) store.del(path); else store.set(path, el.value);
    touched(path);
    if (o.onInput) o.onInput(el.value);
  });
  return el;
}

export function number(path, o = {}) {
  const el = h('input', { class: 'input', type: 'number', min: o.min, max: o.max, step: o.step || 1, inputmode: 'numeric' });
  const cur = store.get(path);
  el.value = typeof cur === 'number' ? String(cur) : '';
  el.addEventListener('input', () => {
    if (el.value === '') { if (o.optional) store.del(path); else store.set(path, ''); } else store.set(path, Number(el.value));
    touched(path);
  });
  return el;
}

export function range(path, o = {}) {
  const out = h('output', { class: 'range-out' });
  const el = h('input', { type: 'range', class: 'range', min: o.min ?? 0, max: o.max ?? 100, step: 1 });
  const cur = store.get(path);
  el.value = typeof cur === 'number' ? cur : 0; out.textContent = el.value + '%';
  el.addEventListener('input', () => { out.textContent = el.value + '%'; store.set(path, Number(el.value)); touched(path); });
  return h('div', { class: 'range-row' }, el, out);
}

export function select(path, options, o = {}) {
  const el = h('select', { class: 'input' }, options.map(([v, label]) => h('option', { value: v, text: label })));
  const cur = store.get(path);
  el.value = cur === undefined || cur === null ? (o.default ?? options[0][0]) : String(cur);
  el.addEventListener('change', () => {
    const v = o.number ? Number(el.value) : el.value;
    store.set(path, v); touched(path);
    if (o.onChange) o.onChange(v);
  });
  return el;
}

export function toggle(path, label, o = {}) {
  const el = h('input', { type: 'checkbox', class: 'switch-input', role: 'switch' });
  const cur = store.get(path);
  el.checked = cur === undefined ? !!o.default : !!cur;
  const id = nid('sw'); el.id = id;
  el.addEventListener('change', () => { store.set(path, el.checked); touched(path); if (o.onChange) o.onChange(el.checked); });
  return h('div', { class: 'field field--toggle' }, el, h('label', { for: id, class: 'switch-label', text: label }), o.hint ? h('div', { class: 'hint', text: o.hint }) : null, errSlot(pstr(path), el));
}

// Localized {tr,en}. optional => key removed when both are empty.
export function loc(path, label, o = {}) {
  const ps = pstr(path);
  const cur = store.get(path);
  const val = (lang) => (cur && typeof cur === 'object' ? cur[lang] || '' : typeof cur === 'string' ? (lang === 'tr' ? cur : '') : '');
  const lid = nid('lbl');
  const wrap = h('div', { class: 'field loc' + (o.class ? ' ' + o.class : ''), role: 'group', 'aria-labelledby': lid });
  wrap.append(h('div', { class: 'field-label', id: lid }, label, o.required ? h('span', { class: 'req', 'aria-hidden': 'true', text: ' *' }) : null));
  const row = h('div', { class: 'loc-row' });
  const els = {};
  for (const lang of ['tr', 'en']) {
    const el = h(o.area ? 'textarea' : 'input', { class: 'input', type: o.area ? null : 'text', rows: o.area ? (o.rows || 3) : null, maxlength: o.max, lang, autocomplete: 'off', 'aria-label': label + ' (' + lang.toUpperCase() + ')' });
    el.value = val(lang);
    els[lang] = el;
    el.addEventListener('input', () => {
      const next = { tr: els.tr.value, en: els.en.value };
      if (o.optional && !next.tr && !next.en) store.del(path); else store.set(path, next);
      touched(path);
      if (lang === 'tr' && o.onTr) o.onTr(next.tr);
    });
    row.append(h('div', { class: 'loc-col' }, h('span', { class: 'lang-tag', 'aria-hidden': 'true', text: lang.toUpperCase() }), el, errSlot(ps + '.' + lang, el)));
  }
  wrap.append(row);
  if (o.hint) wrap.append(h('div', { class: 'hint', text: o.hint }));
  wrap.append(errSlot(ps));
  return wrap;
}

// chips for tags (string or {tr,en})
export function chips(path, label, o = {}) {
  const box = h('div', { class: 'chips' });
  const input = h('input', { class: 'chips-input', type: 'text', placeholder: t('chips.add'), 'aria-label': label, maxlength: 60 });
  const label_ = (tag) => (typeof tag === 'string' ? tag : (tag && tag.tr) || '');
  function draw() {
    box.replaceChildren();
    (store.get(path) || []).forEach((tag, i) => box.append(h('span', { class: 'chip' }, h('span', { text: label_(tag) }),
      h('button', { type: 'button', 'aria-label': t('common.remove') + ': ' + label_(tag), onClick: () => { store.remove(path, i); draw(); input.focus(); } }, '×'))));
    box.append(input);
  }
  function commit() {
    const v = input.value.replace(/,/g, '').trim();
    if (!v) return;
    const list = store.get(path) || [];
    if (!list.some((x) => label_(x).toLowerCase() === v.toLowerCase())) store.insert(path, list.length, v);
    input.value = ''; draw(); input.focus();
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
    else if (e.key === 'Backspace' && !input.value && (store.get(path) || []).length) { store.remove(path, store.get(path).length - 1); draw(); input.focus(); }
  });
  input.addEventListener('blur', commit);
  draw();
  return field(label, box, { path, hint: o.hint });
}

// image picker (library dialog + upload)
export function image(path, label, o = {}) {
  const val = () => store.get(path) || '';
  const img = h('img', { class: 'imgpick-img', alt: '' });
  const ph = h('div', { class: 'imgpick-ph', text: t('img.none') });
  const fig = h('div', { class: 'imgpick-prev' });
  const pathBox = h('input', { class: 'input mono', type: 'text', readonly: true, 'aria-label': label });
  const hint = o.hint ? h('div', { class: 'hint', text: o.hint }) : null;
  function draw() {
    const v = val();
    pathBox.value = v;
    fig.replaceChildren(/^img\/[\w./-]+$/.test(v) && !v.includes('..') ? Object.assign(img, { src: '/' + v }) : ph);
  }
  const choose = h('button', { type: 'button', class: 'btn', onClick: async () => { const p = await imageLibrary(); if (p) { store.set(path, p); touched(path); draw(); } } }, t('img.choose'));
  const clear = h('button', { type: 'button', class: 'btn btn--ghost', onClick: () => { if (o.required) { store.set(path, ''); } else store.del(path); touched(path); draw(); } }, t('img.clear'));
  draw();
  const body = h('div', { class: 'imgpick' }, fig, h('div', { class: 'imgpick-body' }, pathBox, h('div', { class: 'btn-row' }, choose, clear), hint));
  const wrap = field(label, body, { path, required: o.required, noErr: true, class: 'imgpick-field' });
  wrap.append(errSlot(pstr(path), pathBox));
  return wrap;
}

// ---------- sortable lists ----------
function makeSortable(root, onMove) {
  let from = null;
  root.addEventListener('mousedown', (e) => {
    const handle = e.target.closest('.drag-handle');
    const card = handle && handle.closest('.item-card, .sortable-item');
    if (card) card.draggable = true;
  });
  root.addEventListener('dragstart', (e) => {
    const card = e.target.closest && e.target.closest('.item-card, .sortable-item');
    if (!card || card.parentElement !== root) return;
    from = Number(card.dataset.idx); card.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(from));
  });
  root.addEventListener('dragover', (e) => {
    if (from === null) return;
    e.preventDefault();
    const card = e.target.closest('.item-card, .sortable-item');
    root.querySelectorAll('.drop-target').forEach((c) => c.classList.remove('drop-target'));
    if (card && card.parentElement === root) card.classList.add('drop-target');
  });
  root.addEventListener('drop', (e) => {
    if (from === null) return;
    e.preventDefault();
    const card = e.target.closest('.item-card, .sortable-item');
    const to = card && card.parentElement === root ? Number(card.dataset.idx) : null;
    const f = from; from = null;
    if (to !== null && to !== f) onMove(f, to);
  });
  root.addEventListener('dragend', () => {
    from = null;
    root.querySelectorAll('.is-dragging,.drop-target').forEach((c) => c.classList.remove('is-dragging', 'drop-target'));
    root.querySelectorAll('[draggable="true"]').forEach((c) => { c.draggable = false; });
  });
}
export { makeSortable };

export const moveButtons = (i, n, onUp, onDown) => [
  h('button', { type: 'button', class: 'btn btn--ghost btn--icon', 'aria-label': t('common.moveUp'), disabled: i === 0, onClick: onUp }, '↑'),
  h('button', { type: 'button', class: 'btn btn--ghost btn--icon', 'aria-label': t('common.moveDown'), disabled: i === n - 1, onClick: onDown }, '↓'),
];

/**
 * Generic editable list of cards.
 * o: { path, title(item,i), renderItem(itemPath,i,item), newItem(list), addLabel, emptyText, noConfirm, max }
 */
export function listEditor(o) {
  const root = h('div', { class: 'list-editor' });
  const cards = h('div', { class: 'cards' });
  const changed = () => { if (o.onChange) o.onChange(store.get(o.path) || []); };
  const addBtn = h('button', { type: 'button', class: 'btn', onClick: () => { const list = store.get(o.path) || []; store.insert(o.path, list.length, o.newItem(list)); changed(); draw(); const last = cards.lastElementChild; if (last) { const f = last.querySelector('input,textarea,select'); if (f) f.focus(); } } }, '+ ' + o.addLabel);
  function draw() {
    cards.replaceChildren();
    const list = store.get(o.path) || [];
    if (!list.length) cards.append(h('p', { class: 'empty', text: o.emptyText || t('empty.list') }));
    list.forEach((item, i) => {
      const p = [...o.path, i];
      const titleEl = h('span', { class: 'item-title', text: o.title(item, i) });
      const head = h('div', { class: 'item-head' },
        h('span', { class: 'drag-handle', 'aria-hidden': 'true', title: t('common.drag') }, '⋮⋮'), titleEl,
        h('span', { class: 'item-actions' }, moveButtons(i, list.length, () => { store.move(o.path, i, i - 1); changed(); draw(); }, () => { store.move(o.path, i, i + 1); changed(); draw(); }),
          h('button', { type: 'button', class: 'btn btn--ghost btn--icon btn--danger-text', 'aria-label': t('common.delete') + ': ' + titleEl.textContent, onClick: async () => {
            if (!o.noConfirm && !(await confirmDialog({ message: t('confirm.deleteItem'), confirmText: t('common.delete'), danger: true }))) return;
            store.remove(o.path, i); changed(); draw();
          } }, '×')));
      const card = h('div', { class: 'item-card', 'data-idx': i }, head, h('div', { class: 'item-body' }, o.renderItem(p, i, item)));
      card._titleEl = titleEl; card._path = p;
      cards.append(card);
    });
  }
  cards.addEventListener('input', (e) => {
    const card = e.target.closest('.item-card');
    if (card && card.parentElement === cards && card._titleEl) card._titleEl.textContent = o.title(store.get(card._path), Number(card.dataset.idx));
  });
  makeSortable(cards, (from, to) => { store.move(o.path, from, to); changed(); draw(); });
  draw();
  root.append(cards, h('div', { class: 'btn-row' }, addBtn));
  return root;
}

// ---------- spec driven forms ----------
export const S = {
  loc: (key, label, o = {}) => ({ type: 'loc', key, label, ...o }),
  text: (key, label, o = {}) => ({ type: 'text', key, label, ...o }),
  num: (key, label, o = {}) => ({ type: 'num', key, label, ...o }),
  range: (key, label, o = {}) => ({ type: 'range', key, label, ...o }),
  select: (key, label, options, o = {}) => ({ type: 'select', key, label, options, ...o }),
  bool: (key, label, o = {}) => ({ type: 'bool', key, label, ...o }),
  image: (key, label, o = {}) => ({ type: 'image', key, label, ...o }),
  chips: (key, label, o = {}) => ({ type: 'chips', key, label, ...o }),
};

export function renderSpec(base, spec) {
  const frag = h('div', { class: 'form-grid' });
  for (const f of spec) {
    const p = [...base, f.key];
    const lbl = t(f.label);
    const hint = f.hint ? t(f.hint) : undefined;
    let el;
    switch (f.type) {
      case 'loc': el = loc(p, lbl, { area: f.area, rows: f.rows, required: f.required, optional: !f.required && !f.keep, max: f.max, hint }); break;
      case 'text': el = field(lbl, text(p, { multiline: f.area, mono: f.mono, max: f.max, type: f.input, placeholder: f.placeholder }), { path: p, required: f.required, hint }); break;
      case 'num': el = field(lbl, number(p, { min: f.min, max: f.max, optional: f.optional }), { path: p, required: f.required, hint }); break;
      case 'range': el = field(lbl, range(p), { path: p, hint }); break;
      case 'select': el = field(lbl, select(p, f.options.map(([v, k]) => [v, k ? t(k) : v]), { default: f.default }), { path: p, hint }); break;
      case 'bool': el = toggle(p, lbl, { default: f.default, hint }); break;
      case 'image': el = image(p, lbl, { required: f.required, hint }); break;
      case 'chips': el = chips(p, lbl, { hint }); break;
      default: continue;
    }
    if (f.wide) el.classList.add('span-2');
    frag.append(el);
  }
  return frag;
}

export { fmtBytes };
