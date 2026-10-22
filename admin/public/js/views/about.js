import { h } from '../dom.js';
import { t } from '../i18n.js';
import { nextId } from '../store.js';
import { S, renderSpec, listEditor, loc } from '../fields.js';
import { blockEditor } from './blocks.js';

const L = () => ({ tr: '', en: '' });
const titleOf = (k, fb) => (it, i) => (it && it[k] && it[k].tr) || t(fb, { n: i + 1 });

function section(titleKey, hintKey, ...kids) {
  return h('section', { class: 'card' }, h('h2', { text: t(titleKey) }), hintKey ? h('p', { class: 'muted', text: t(hintKey) }) : null, ...kids);
}

function simpleList(key, prefix, titleKey, fb, spec, extra = {}) {
  return listEditor({
    path: [key], addLabel: t(prefix + '.add'), emptyText: t(prefix + '.empty'), title: titleOf(titleKey, fb),
    newItem: (list) => ({ id: nextId(extra.idp || key, list), ...extra.blank }),
    renderItem: (p) => renderSpec(p, spec), ...extra.opts,
  });
}

export function render() {
  const root = h('div', { class: 'view' });
  root.append(
    section('about.bio', 'about.bio.hint', listEditor({
      path: ['bio'], addLabel: t('about.bio.add'), emptyText: t('about.bio.empty'),
      title: (it, i) => t('about.bio.item', { n: i + 1 }) + ((it && it.tr) ? ' - ' + it.tr.slice(0, 40) : ''),
      newItem: () => L(), renderItem: (p) => loc(p, t('f.text'), { area: true, rows: 4, required: true }),
    })),
    section('about.interests', 'about.interests.hint', simpleList('interests', 'about.interests', 'text', 'about.item', [S.loc('text', 'f.text', { required: true })], { idp: 'int', blank: { text: L() } })),
    section('about.skills', 'about.skills.hint', simpleList('skills', 'about.skills', 'label', 'about.item', [
      S.loc('label', 'f.label', { required: true }), S.range('percent', 'f.percent'),
      S.select('type', 'f.type', [['bar', 'skill.bar'], ['ring', 'skill.ring']], { default: 'bar' }),
    ], { idp: 'skill', blank: { label: L(), percent: 50, type: 'bar' } })),
    section('about.priorities', 'about.priorities.hint', simpleList('priorities', 'about.priorities', 'text', 'about.item', [S.loc('text', 'f.text', { required: true })], { idp: 'pri', blank: { text: L() } })),
    section('about.schedule', 'about.schedule.hint', simpleList('schedule', 'about.schedule', 'course', 'about.item', [
      S.loc('day', 'f.day', { required: true }), S.text('time', 'f.time', { placeholder: '09:00 - 12:00' }), S.loc('course', 'f.course', { required: true }), S.text('room', 'f.room'),
    ], { idp: 'sch', blank: { day: L(), time: '', course: L(), room: '' } })),
    section('about.timeline', 'about.timeline.hint', simpleList('timeline', 'about.timeline', 'title', 'about.item', [
      S.loc('period', 'f.period'), S.loc('title', 'f.title', { required: true }), S.loc('place', 'f.place'), S.loc('text', 'f.text', { area: true }),
    ], { idp: 'tl', blank: { period: L(), title: L(), place: L(), text: L() } })),
    section('about.process', 'about.process.hint', simpleList('process', 'about.process', 'title', 'about.item', [
      S.loc('title', 'f.title', { required: true }), S.loc('text', 'f.text', { area: true }),
    ], { idp: 'step', blank: { title: L(), text: L() } })),
    section('about.tools', 'about.tools.hint', simpleList('tools', 'about.tools', 'label', 'about.item', [S.loc('label', 'f.label', { required: true })], { idp: 'tool', blank: { label: L() } })),
    section('about.faq', 'about.faq.hint', simpleList('faq', 'about.faq', 'q', 'about.item', [
      S.loc('q', 'f.question', { required: true }), S.loc('a', 'f.answer', { required: true, area: true }),
    ], { idp: 'faq', blank: { q: L(), a: L() } })),
    section('about.principles', 'about.principles.hint', renderSpec(['principles'], [S.loc('title', 'f.title')]), blockEditor(['principles', 'blocks'])),
    section('about.blogNote', null, renderSpec(['blogNote'], [S.loc('title', 'f.title'), S.loc('text', 'f.text', { area: true })])));
  return root;
}
