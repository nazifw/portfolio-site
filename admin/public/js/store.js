// Single working copy of content.js data + dirty tracking + server validation errors.
const listeners = new Set();

export const pstr = (path) => path.reduce((s, k) => (typeof k === 'number' ? s + '[' + k + ']' : s ? s + '.' + k : String(k)), '');

export const store = {
  content: null,
  savedStr: '',
  errors: [],
  ui: { selected: {} },

  load(obj) {
    this.content = obj;
    this.savedStr = JSON.stringify(obj);
    this.errors = [];
    emit();
  },
  markSaved() { this.savedStr = JSON.stringify(this.content); emit(); },
  isDirty() { return this.content !== null && JSON.stringify(this.content) !== this.savedStr; },
  saved() { return this.savedStr ? JSON.parse(this.savedStr) : null; },

  get(path, root = this.content) {
    let cur = root;
    for (const k of path) { if (cur === null || cur === undefined) return undefined; cur = cur[k]; }
    return cur;
  },
  _parent(path) {
    let cur = this.content;
    for (const k of path.slice(0, -1)) {
      if (cur[k] === undefined || cur[k] === null) cur[k] = {};
      cur = cur[k];
      if (typeof cur !== 'object') throw new Error('bad path ' + pstr(path));
    }
    return cur;
  },
  set(path, val) { this._parent(path)[path[path.length - 1]] = val; emit(); },
  del(path) { delete this._parent(path)[path[path.length - 1]]; emit(); },
  // ensure array exists at path, return it
  list(path) {
    let arr = this.get(path);
    if (!Array.isArray(arr)) { arr = []; this.set(path, arr); }
    return arr;
  },
  insert(path, idx, val) { this.list(path).splice(idx, 0, val); this.errors = []; emit(); },
  remove(path, idx) { this.list(path).splice(idx, 1); this.errors = []; emit(); },
  move(path, from, to) {
    const a = this.list(path);
    if (to < 0 || to >= a.length || from === to) return;
    a.splice(to, 0, a.splice(from, 1)[0]);
    this.errors = [];
    emit();
  },
  clearError(ps) { this.errors = this.errors.filter((e) => e.path !== ps); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

function emit() { listeners.forEach((fn) => fn()); }

// next unused id like "proj-7" (ids are never reused within the current document)
export function nextId(prefix, list) {
  let max = 0;
  const re = new RegExp('^' + prefix + '-(\\d+)$');
  for (const it of list || []) { const m = re.exec(it && it.id); if (m) max = Math.max(max, Number(m[1])); }
  return prefix + '-' + (max + 1);
}
