/* theme.js — koyu/acik tema. Ilk boyama <head> icindeki inline script ile yapilir (FOUC yok). */
(function () {
  'use strict';
  var root = document.documentElement;
  var KEY = 'theme';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function system() { return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; }
  function current() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f1e8' : '#1a1714');
    var btn = document.querySelector('.theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
  }

  function set(theme, persist) {
    if (persist) { try { localStorage.setItem(KEY, theme); } catch (e) {} }
    if (theme === current()) return;
    // Ateş tabanindan yayilan dairesel reveal (View Transitions destekliyse)
    if (!reduce && document.startViewTransition) {
      var x = Math.round(window.innerWidth * 0.06), y = Math.round(window.innerHeight * 0.96);
      var r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      var t = document.startViewTransition(function () { apply(theme); });
      t.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 900, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
    } else {
      root.classList.add('theme-anim');
      apply(theme);
      setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
    }
  }

  function init() {
    apply(current());
    var btn = document.querySelector('.theme-toggle');
    if (btn) btn.addEventListener('click', function () { set(current() === 'light' ? 'dark' : 'light', true); });
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: light)');
      var h = function () { if (!stored()) set(system(), false); };
      if (mq.addEventListener) mq.addEventListener('change', h); else if (mq.addListener) mq.addListener(h);
    }
  }
  window.siteTheme = { set: set, get: current };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
