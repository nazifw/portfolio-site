// Master/detail editor used for projects and blog posts: sortable list on the left, form on the right.
import { h } from '../dom.js';
import { t } from '../i18n.js';
import { store, pstr } from '../store.js';
import { makeSortable, moveButtons } from '../fields.js';
import { confirmDialog } from '../ui.js';

export function masterDetail(o) {
  const root = h('div', { class: 'master' });
  const rows = h('div', { class: 'rows', role: 'list', 'aria-label': o.listLabel });
  const formBox = h('div', { class: 'master-form' });
  const list = () => store.get(o.path) || [];
  const clamp = (i) => Math.max(0, Math.min(list().length - 1, i | 0));
  let sel = clamp(store.ui.selected[o.key] ?? 0);

  const select = (i, focus) => { sel = clamp(i); store.ui.selected[o.key] = sel; drawList(); drawForm(); if (focus) formBox.focus(); };

  function drawList() {
    rows.replaceChildren();
    const l = list();
    if (!l.length) rows.append(h('p', { class: 'empty', text: o.emptyText }));
    l.forEach((it, i) => {
      const info = o.row(it, i);
      const hasErr = store.errors.some((e) => e.path.startsWith(o.key + '[' + i + ']'));
      const thumb = info.thumb && /^img\/[\w./-]+$/.test(info.thumb) && !info.thumb.includes('..') ? h('img', { src: '/' + info.thumb, alt: '', loading: 'lazy' }) : h('span', { class: 'thumb-ph' });
      const row = h('div', { class: 'sortable-item row' + (i === sel ? ' is-selected' : '') + (hasErr ? ' has-error' : '') + (info.hidden ? ' is-hidden' : ''), role: 'listitem', 'data-idx': i },
        h('span', { class: 'drag-handle', 'aria-hidden': 'true', title: t('common.drag') }, '⋮⋮'),
        h('button', { type: 'button', class: 'row-main', 'aria-current': i === sel ? 'true' : null, onClick: () => select(i, true) },
          h('span', { class: 'row-thumb' }, thumb),
          h('span', { class: 'row-text' }, h('strong', { text: info.title || t('common.untitled') }), h('small', { class: 'muted', text: info.sub || '' })),
          info.badge ? h('span', { class: 'badge badge--' + (info.badgeKind || 'plain'), text: info.badge }) : null,
          hasErr ? h('span', { class: 'badge badge--danger', text: '!' }) : null),
        h('span', { class: 'row-actions' }, moveButtons(i, l.length, () => move(i, i - 1), () => move(i, i + 1))));
      rows.append(row);
    });
  }

  function move(from, to) {
    store.move(o.path, from, to);
    if (o.afterMove) o.afterMove(list());
    if (sel === from) sel = to; else if (from < sel && to >= sel) sel -= 1; else if (from > sel && to <= sel) sel += 1;
    store.ui.selected[o.key] = sel;
    drawList(); drawForm();
  }

  function drawForm() {
    formBox.replaceChildren();
    const l = list();
    if (!l.length) { formBox.append(h('div', { class: 'card empty-card' }, h('p', { text: o.emptyText }))); return; }
    const p = [...o.path, sel];
    formBox.append(h('div', { class: 'master-form-head' }, h('h2', { text: o.formTitle(l[sel]) }),
      h('button', { type: 'button', class: 'btn btn--danger-outline', onClick: async () => {
        if (!(await confirmDialog({ message: t('confirm.deleteNamed', { name: o.row(l[sel], sel).title || t('common.untitled') }), confirmText: t('common.delete'), danger: true }))) return;
        store.remove(o.path, sel);
        if (o.afterMove) o.afterMove(list());
        select(Math.min(sel, list().length - 1));
      } }, t('common.delete'))), o.renderForm(p, l[sel]));
  }

  makeSortable(rows, (from, to) => move(from, to));
  formBox.tabIndex = -1;
  formBox.addEventListener('input', drawList);
  formBox.addEventListener('change', drawList);
  const onErr = () => { if (!root.isConnected) return window.removeEventListener('errors-applied', onErr); drawList(); };
  window.addEventListener('errors-applied', onErr);

  const add = h('button', { type: 'button', class: 'btn btn--primary', onClick: () => {
    const l = list();
    store.insert(o.path, l.length, o.newItem(l));
    if (o.afterMove) o.afterMove(list());
    select(list().length - 1);
    const f = formBox.querySelector('input,textarea'); if (f) f.focus();
  } }, '+ ' + o.addLabel);

  root.append(h('div', { class: 'master-list' }, h('div', { class: 'master-list-head' }, add), rows), formBox);
  drawList(); drawForm();
  return root;
}

export { pstr };
