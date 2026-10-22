/* i18n.js - YALNIZCA arayuz metinleri (menu, buton, etiket, hata, bos durum). Icerik: data/content.js.
   Anahtarlar HTML'de data-i18n="anahtar" ile baglanir; render.js i18n.t() kullanir. */
window.I18N_DICT = {
 "tr": {
  "ui.menuClose": "Menüyü kapat",
  "lb.label": "Görsel büyütme penceresi",
  "lb.close": "Kapat",
  "lb.prev": "Önceki görsel",
  "lb.next": "Sonraki görsel",
  "copy.btn": "Kopyala",
  "copy.ok": "Kopyalandı ✓",
  "form.counter": "{n} / 600 karakter",
  "form.err.name": "Lütfen adınızı yazın (en az 2 karakter).",
  "form.err.email": "Geçerli bir e-posta adresi girin.",
  "form.err.subject": "Lütfen bir konu seçin.",
  "form.err.message": "Mesajınız en az 10 karakter olmalı.",
  "form.err.consent": "Devam etmek için onay kutusunu işaretleyin.",
  "home.cta1": "Projelerime göz at",
  "home.cta2": "İletişime geç",
  "home.scroll": "Aşağı kaydır",
  "home.aboutH2": "Kısaca ben",
  "home.projH2": "Seçili projeler",
  "home.projLead": "Dönem boyunca hazırladığım çalışmalardan üçü. Tamamı projeler sayfasında.",
  "home.galH2": "Galeriden kareler",
  "home.blogH2": "Son yazılar",
  "nav.journey": "Ana yolculuk",
  "j.open": "Tam sayfayı aç",
  "j.progress": "Bölüm ilerlemesi",
  "nav.home": "Anasayfa",
  "nav.about": "Hakkımda",
  "nav.projects": "Projeler",
  "nav.blog": "Blog",
  "nav.gallery": "Galeri",
  "nav.contact": "İletişim",
  "ui.menuOpen": "Menüyü aç",
  "ui.theme": "Temayı değiştir (koyu/açık)",
  "ui.lang": "Dil seçimi",
  "ui.mainNav": "Ana menü",
  "ui.footNav": "Alt menü",
  "ui.top": "Sayfanın başına dön",
  "ui.skip": "İçeriğe geç",
  "foot.big": "İyi geceler, yolun açık olsun.",
  "foot.sub": "Sade arayüzler, düzgün kod, sıcak bir ateş.",
  "foot.pages": "Sayfalar",
  "foot.contact": "İletişim",
  "foot.top": "Yukarı",
  "about.eyebrow": "Hakkımda",
  "about.h1": "Kod yazan, <em>merak eden</em> biri.",
  "about.meH2": "Ben kimim?",
  "fact.name": "Ad",
  "fact.dept": "Bölüm",
  "fact.year": "Sınıf",
  "fact.city": "Şehir",
  "about.cvH2": "Özgeçmiş",
  "about.schH2": "Ders programım",
  "about.schLead": "Bu dönemki haftalık ders programım (örnek veri).",
  "about.schAria": "Haftalık ders programı tablosu, yatay kaydırılabilir",
  "about.schCap": "Güz dönemi haftalık ders programı. Saatler ve sınıflar örnektir.",
  "th.day": "Gün",
  "th.time": "Saat",
  "th.course": "Ders",
  "th.room": "Derslik",
  "about.intH2": "İlgi alanlarım",
  "about.intH3a": "İlgi duyduğum konular (sırasız liste)",
  "about.intH3b": "Öğrenme önceliklerim (sıralı liste)",
  "about.skH2": "Yeteneklerim",
  "about.skLead": "Yüzdeler, kendi değerlendirmemdir; yeteneğe göre sıralıdır.",
  "about.skH3a": "Teknik yetenekler",
  "about.skH3b": "Kişisel yetkinlikler",
  "projects.eyebrow": "Portfolyo",
  "projects.h1": "Hareketle <em>anlatılan</em> işler.",
  "projects.procH2": "Çalışma sürecim",
  "projects.toolsH2": "Kullandığım araçlar",
  "blog.eyebrow": "Yazılar",
  "blog.h1": "Öğrendikçe <em>yazıyorum</em>.",
  "blog.postsH2": "Son yazılar",
  "blog.read": "Yazıyı oku",
  "blog.topicsH2": "Konular",
  "gallery.eyebrow": "Fotoğraflar",
  "gallery.h1": "Işığın <em>peşinde</em>.",
  "gallery.secLabel": "Fotoğraf galerisi",
  "subj.none": "Bir konu seçin",
  "subj.genel": "Genel soru",
  "subj.proje": "Proje hakkında",
  "subj.is": "İş birliği",
  "subj.diger": "Diğer",
  "contact.eyebrow": "İletişim",
  "contact.h1": "Bir <em>merhaba</em> de.",
  "contact.lead": "Soru, öneri ya da iş birliği için bana ulaşabilirsin. Aşağıdaki formu doldur ya da doğrudan yaz.",
  "contact.infoH2": "İletişim bilgileri",
  "contact.addr": "Adres",
  "contact.phone": "Telefon",
  "contact.mail": "E-posta",
  "contact.hours": "Yanıt süresi",
  "contact.formH2": "Mesaj gönder",
  "form.name": "Adınız",
  "form.email": "E-posta",
  "form.subject": "Konu",
  "form.message": "Mesajınız",
  "form.consent": "Mesajımın yanıtlanması için iletişim bilgilerimin kullanılmasını kabul ediyorum.",
  "form.send": "Gönder",
  "form.okH": "Teşekkürler, mesajın alındı!",
  "form.okP": "Bu şablonda form gerçekten göndermez; doğrulama ve teşekkür durumu tarayıcıda çalışır.",
  "form.again": "Yeni mesaj yaz",
  "contact.faqH2": "Sık sorulan sorular",
  "post.prevPost": "Önceki yazı",
  "post.nextPost": "Sonraki yazı",
  "post.toBlog": "Tüm yazılar",
  "post.back": "← Blog",
  "post.navAria": "Yazılar arası gezinme",
  "home.hi": "Merhaba, ben",
  "about.lead": "Aşağıda kısa özgeçmişi, ders programını, ilgi alanlarını ve yetenekleri bulabilirsin.",
  "projects.lead": "Hazırladığım çalışmalar. Etikete göre filtreleyebilirsin.",
  "projects.listH2": "Tüm projeler",
  "blog.lead": "Yazılım ve web üzerine notlar.",
  "gallery.lead": "Kısa açıklamalı kareler. Büyütmek için görsele tıkla.",
  "foot.rights": "Tüm hakları saklıdır.",
  "about.title": "Hakkımda",
  "about.desc": "Özgeçmiş, ders programı, ilgi alanları ve yetenekler.",
  "projects.title": "Projeler",
  "projects.desc": "Projeler, kısa açıklamaları, durumları ve etiketleriyle.",
  "blog.title": "Blog",
  "blog.desc": "Yazılım ve web üzerine yazılar.",
  "gallery.title": "Galeri",
  "gallery.desc": "Kısa açıklamalı fotoğraf galerisi.",
  "contact.title": "İletişim",
  "contact.desc": "İletişim bilgileri ve doğrulamalı iletişim formu.",
  "contact.map": "Harita",
  "contact.mapLink": "Haritada aç",
  "contact.social": "Sosyal bağlantılar",
  "about.socialH2": "Beni takip et",
  "status.done": "Tamamlandı",
  "status.wip": "Devam ediyor",
  "status.planned": "Planlanıyor",
  "filter.all": "Tümü",
  "filter.label": "Projeleri etikete göre filtrele",
  "proj.github": "Kaynak kodu",
  "proj.demo": "Canlı demo",
  "post.readMin": "{n} dk okuma",
  "post.notFoundH": "Yazı bulunamadı",
  "post.notFoundP": "Aradığın yazı yok ya da kaldırılmış olabilir.",
  "post.title": "Yazı",
  "empty.projects": "Henüz proje eklenmedi. Yakında burada olacak.",
  "empty.filter": "Bu etiketle eşleşen proje yok.",
  "empty.posts": "Henüz yazı yok. Yakında burada olacak.",
  "empty.gallery": "Galeri henüz boş.",
  "empty.generic": "Henüz içerik eklenmedi."
 },
 "en": {
  "ui.menuClose": "Close menu",
  "lb.label": "Image viewer",
  "lb.close": "Close",
  "lb.prev": "Previous image",
  "lb.next": "Next image",
  "copy.btn": "Copy",
  "copy.ok": "Copied ✓",
  "form.counter": "{n} / 600 characters",
  "form.err.name": "Please enter your name (at least 2 characters).",
  "form.err.email": "Please enter a valid email address.",
  "form.err.subject": "Please choose a subject.",
  "form.err.message": "Your message must be at least 10 characters.",
  "form.err.consent": "Please tick the checkbox to continue.",
  "home.cta1": "See my projects",
  "home.cta2": "Get in touch",
  "home.scroll": "Scroll down",
  "home.aboutH2": "A short intro",
  "home.projH2": "Selected projects",
  "home.projLead": "Three pieces from my term's work. The full set is on the projects page.",
  "home.galH2": "Frames from the gallery",
  "home.blogH2": "Latest posts",
  "nav.journey": "Main journey",
  "j.open": "Open full page",
  "j.progress": "Section progress",
  "nav.home": "Home",
  "nav.about": "About",
  "nav.projects": "Projects",
  "nav.blog": "Blog",
  "nav.gallery": "Gallery",
  "nav.contact": "Contact",
  "ui.menuOpen": "Open menu",
  "ui.theme": "Toggle theme (dark/light)",
  "ui.lang": "Language",
  "ui.mainNav": "Main navigation",
  "ui.footNav": "Footer navigation",
  "ui.top": "Back to top",
  "ui.skip": "Skip to content",
  "foot.big": "Good night, and safe travels.",
  "foot.sub": "Calm interfaces, tidy code, a warm fire.",
  "foot.pages": "Pages",
  "foot.contact": "Contact",
  "foot.top": "Top",
  "about.eyebrow": "About",
  "about.h1": "Someone who writes code and <em>stays curious</em>.",
  "about.meH2": "Who am I?",
  "fact.name": "Name",
  "fact.dept": "Department",
  "fact.year": "Year",
  "fact.city": "City",
  "about.cvH2": "Résumé",
  "about.schH2": "My class schedule",
  "about.schLead": "My weekly timetable this term (sample data).",
  "about.schAria": "Weekly class schedule table, horizontally scrollable",
  "about.schCap": "Fall term weekly schedule. Times and rooms are examples.",
  "th.day": "Day",
  "th.time": "Time",
  "th.course": "Course",
  "th.room": "Room",
  "about.intH2": "My interests",
  "about.intH3a": "Things I'm into (unordered list)",
  "about.intH3b": "My learning priorities (ordered list)",
  "about.skH2": "My skills",
  "about.skLead": "Percentages are my own estimate, ordered by level.",
  "about.skH3a": "Technical skills",
  "about.skH3b": "Personal strengths",
  "projects.eyebrow": "Portfolio",
  "projects.h1": "Work told through <em>motion</em>.",
  "projects.procH2": "My process",
  "projects.toolsH2": "Tools I use",
  "blog.eyebrow": "Writing",
  "blog.h1": "I write as I <em>learn</em>.",
  "blog.postsH2": "Latest posts",
  "blog.read": "Read post",
  "blog.topicsH2": "Topics",
  "gallery.eyebrow": "Photos",
  "gallery.h1": "<em>Chasing</em> the light.",
  "gallery.secLabel": "Photo gallery",
  "subj.none": "Choose a subject",
  "subj.genel": "General question",
  "subj.proje": "About a project",
  "subj.is": "Collaboration",
  "subj.diger": "Other",
  "contact.eyebrow": "Contact",
  "contact.h1": "Say <em>hello</em>.",
  "contact.lead": "Reach out for a question, a suggestion or a collaboration. Fill in the form below or write to me directly.",
  "contact.infoH2": "Contact details",
  "contact.addr": "Address",
  "contact.phone": "Phone",
  "contact.mail": "Email",
  "contact.hours": "Response time",
  "contact.formH2": "Send a message",
  "form.name": "Your name",
  "form.email": "Email",
  "form.subject": "Subject",
  "form.message": "Your message",
  "form.consent": "I agree that my contact details may be used to reply to my message.",
  "form.send": "Send",
  "form.okH": "Thank you, your message was received!",
  "form.okP": "In this template the form does not really send anything; validation and the thank-you state run in the browser.",
  "form.again": "Write another message",
  "contact.faqH2": "Frequently asked questions",
  "post.prevPost": "Previous post",
  "post.nextPost": "Next post",
  "post.toBlog": "All posts",
  "post.back": "← Blog",
  "post.navAria": "Post navigation",
  "home.hi": "Hi, I'm",
  "about.lead": "Below you will find a short CV, the class schedule, interests and skills.",
  "projects.lead": "Things I have built. You can filter them by tag.",
  "projects.listH2": "All projects",
  "blog.lead": "Notes on software and the web.",
  "gallery.lead": "Photos with short captions. Click an image to enlarge it.",
  "foot.rights": "All rights reserved.",
  "about.title": "About",
  "about.desc": "CV, class schedule, interests and skills.",
  "projects.title": "Projects",
  "projects.desc": "Projects with short descriptions, statuses and tags.",
  "blog.title": "Blog",
  "blog.desc": "Posts about software and the web.",
  "gallery.title": "Gallery",
  "gallery.desc": "A photo gallery with short captions.",
  "contact.title": "Contact",
  "contact.desc": "Contact details and a validated contact form.",
  "contact.map": "Map",
  "contact.mapLink": "Open on map",
  "contact.social": "Social links",
  "about.socialH2": "Find me online",
  "status.done": "Done",
  "status.wip": "In progress",
  "status.planned": "Planned",
  "filter.all": "All",
  "filter.label": "Filter projects by tag",
  "proj.github": "Source code",
  "proj.demo": "Live demo",
  "post.readMin": "{n} min read",
  "post.notFoundH": "Post not found",
  "post.notFoundP": "The post you are looking for does not exist or may have been removed.",
  "post.title": "Post",
  "empty.projects": "No projects yet. Check back soon.",
  "empty.filter": "No projects match this tag.",
  "empty.posts": "No posts yet. Check back soon.",
  "empty.gallery": "The gallery is empty for now.",
  "empty.generic": "Nothing here yet."
 }
};

/* ---- i18n mantigi ---- */
(function () {
  'use strict';
  var D = window.I18N_DICT;
  var KEY = 'lang';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = 'tr';

  function stored() { try { var v = localStorage.getItem(KEY); return v === 'en' || v === 'tr' ? v : null; } catch (e) { return null; } }
  /* Kayitli dil yoksa data/content.js icindeki settings.defaultLang kullanilir */
  function startLang() {
    var s = stored(); if (s) return s;
    var c = window.SITE_CONTENT, d = c && c.settings && c.settings.defaultLang;
    return d === 'en' ? 'en' : 'tr';
  }

  function t(key, vars) {
    var s = (D[lang] && D[lang][key]) || (D.tr && D.tr[key]) || key;
    if (vars) for (var k in vars) s = s.replace('{' + k + '}', vars[k]);
    return s;
  }

  function translate() {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], k = el.getAttribute('data-i18n'), v = D[lang][k];
      if (v === undefined) continue;
      if (el.hasAttribute('data-i18n-html')) el.innerHTML = v; else el.textContent = v;
    }
    var at = document.querySelectorAll('[data-i18n-attr]');
    for (var j = 0; j < at.length; j++) {
      at[j].getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':'); if (p.length < 2) return;
        var v = D[lang][p[1]]; if (v !== undefined) this.setAttribute(p[0], v);
      }, at[j]);
    }
    var btns = document.querySelectorAll('[data-lang-set]');
    for (var b = 0; b < btns.length; b++) btns[b].setAttribute('aria-pressed', btns[b].getAttribute('data-lang-set') === lang ? 'true' : 'false');
  }

  /* Dil degisimi: document 'i18nchange' (eski) + window 'langchange' (render.js dinler) */
  function emit() {
    document.dispatchEvent(new CustomEvent('i18nchange', { detail: { lang: lang } }));
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  function set(next, persist) {
    if (next !== 'tr' && next !== 'en') return;
    if (persist) { try { localStorage.setItem(KEY, next); } catch (e) {} }
    if (next === lang) return;
    var main = document.querySelector('main');
    var run = function () {
      lang = next;
      root.setAttribute('lang', lang);
      translate();
      emit();
      if (main) main.classList.remove('is-lang-switching');
    };
    if (main && !reduce) { main.classList.add('is-lang-switching'); setTimeout(run, 130); } else run();
  }

  window.i18n = { t: t, set: set, get lang() { return lang; } };

  function init() {
    var s = startLang();
    var btns = document.querySelectorAll('[data-lang-set]');
    for (var b = 0; b < btns.length; b++) btns[b].addEventListener('click', function () { set(this.getAttribute('data-lang-set'), true); });
    if (s !== 'tr') { lang = s; root.setAttribute('lang', lang); translate(); emit(); }
    else { root.setAttribute('lang', 'tr'); translate(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
