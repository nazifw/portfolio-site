import { DICT } from './dict.js';

let lang = 'en';
try {
  const saved = localStorage.getItem('admin.lang');
  lang = saved === 'tr' || saved === 'en' ? saved : (navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en';
} catch (_) { lang = (navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en'; }

export const getLang = () => lang;

export function setLang(l) {
  lang = l === 'tr' ? 'tr' : 'en';
  try { localStorage.setItem('admin.lang', lang); } catch (_) { /* ignore */ }
  document.documentElement.lang = lang;
  window.dispatchEvent(new CustomEvent('admin-lang'));
}

export function t(key, vars) {
  let s = (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(String(v));
  return s;
}

export function fmtDate(iso) {
  try { return new Date(iso).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }); } catch (_) { return iso; }
}

document.documentElement.lang = lang;
