# 02 – UX Yapısı: Ad Soyad Portfolyo

Durum: Taslak v1 · Kapsam: kod yok, yalnızca UX kararları. Tüm `[PLACEHOLDER]` değerleri kullanıcı tarafından doldurulacaktır.

Tasarım ilkeleri: **sade, chill, güçlü**. Tek vurgu rengi (ateş turuncusu), bol boşluk, hareket anlamlı olmalı (süs değil). İçerik **veri odaklı**: tüm metin/proje/link `content` verisinden gelir, böylece Admin Panel sonradan aynı şemayı yönetir.

---

## 1. Kullanıcı Hedefleri ve Persona'lar

| Persona | Kim | Ne arar | Başarı ölçütü | Süre bütçesi |
|---|---|---|---|---|
| **İşe alımcı / Staj yetkilisi** (Elif, 32) | Çok sayıda portfolyo tarar | Kim, ne yapıyor, en iyi 2-3 iş, CV, iletişim | 30 sn içinde "bu kişiyi arayabilirim" | 30-90 sn |
| **Hoca / Değerlendirici** (Dr. Kaya) | Vize projesini notlar | Teknik beceri, yapı, a11y, i18n/tema, özgünlük, çalışan proje | Gereksinimlerin hepsinin görünür ve çalışır olması | 5-10 dk |
| **Akran / Geliştirici** (Mert, 21) | İlham, işbirliği | GitHub reposu, stack, kod kalitesi, sosyal hesaplar | Repo'ya tek tıkla gitmek, takip etmek | 1-3 dk |

Ortak hedefler: ilk ekranda "kimsin" cevabı; projeye 2 tıkta ulaşım; iletişim her sayfadan 1 tık uzakta; CV indirme.

---

## 2. Sitemap ve Sayfa Bölümleri

```
/                  Home
/projects          Projeler listesi
/projects/:slug    Proje detay
/about             Hakkımda
/contact           İletişim
/404               Bulunamadı
(/admin)           Gelecek: Admin panel (şimdilik rezerve, sitemap'te yok)
```

### 2.1 Home `/`
| # | Bölüm | Amaç |
|---|---|---|
| 1 | **Hero** – ad, rol, 1 cümle slogan, 2 CTA (Projeleri Gör / İletişim) | 5 sn içinde kim olduğunu söyle |
| 2 | **Kısa tanıtım** (2-3 cümle + foto) | Kişisel bağ, güven |
| 3 | **Öne çıkan projeler** (3 kart, `featured=true`) | Kanıt: en iyi işler |
| 4 | **Yetenekler / Stack** (etiket grid) | Tarama kolaylığı |
| 5 | **GitHub özeti** (profil kartı: repo sayısı, takipçi, son aktivite) | Canlı kanıt, akran hedefi |
| 6 | **Sosyal / CTA şeridi** ("Birlikte bir şey yapalım") | Dönüşüm → Contact |

### 2.2 Projects `/projects`
1. Sayfa başlığı + kısa açıklama (amaç: bağlam)
2. Filtre/etiket çubuğu (bkz. 6)
3. Proje grid'i (kartlar)
4. Boş/hata durumları (bkz. 11)
5. "Tüm repoları GitHub'da gör" bağlantısı

### 2.3 Project Detail `/projects/:slug`
1. Geri bağlantısı (breadcrumb: Projeler / Başlık)
2. Başlık, durum rozeti, etiketler, süre/rol
3. Kapak görseli / ekran görüntüsü galerisi
4. Özet + problem + çözüm (uzun açıklama)
5. Teknolojiler ve özellikler listesi
6. Linkler: Canlı demo, GitHub repo (yıldız, dil)
7. Önceki / sonraki proje navigasyonu (keşfi sürdürür)

### 2.4 About `/about`
1. Başlık + portre + uzun biyografi (hikâye)
2. Zaman çizgisi (eğitim, deneyim, kilometre taşları)
3. Yetenekler (kategorili: Frontend, Backend, Araçlar, Diller)
4. İlgi alanları / "Kamp ateşi başında" kişisel bölüm (kişilik)
5. CV indir CTA

### 2.5 Contact `/contact`
1. Başlık + davet cümlesi + müsaitlik durumu
2. İletişim kartları (e-posta, GitHub, LinkedIn, vb.)
3. İletişim formu (ad, e-posta, mesaj) — Faz 1'de `mailto:` yedekli
4. Konum/saat dilimi (opsiyonel)

---

## 3. Wireframe'ler

### 3.1 Masaüstü – Home (≥1024px)
```
┌──────────────────────────────────────────────────────────────┐
│ ◉ Ad Soyad      Home Projects About Contact     [TR|EN] [☀/☾]   │ sticky header
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   Merhaba, ben Ad Soyad.                       ┌────────────┐   │
│   [Rol] geliştirici.                        │  foto /    │   │
│   Slogan tek cümle.                         │  görsel    │   │
│   [Projeleri Gör]  [İletişim]               └────────────┘   │
│                                                              │
│   ↓ scroll                                                   │
├──────────────────────────────────────────────────────────────┤
│  Öne Çıkan Projeler                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐                          │
│  │ görsel │  │ görsel │  │ görsel │                          │
│  │ başlık │  │ başlık │  │ başlık │                          │
│  │ ●Geliş.│  │ ●Tamam.│  │ ●Geliş.│                          │
│  └────────┘  └────────┘  └────────┘                          │
├──────────────────────────────────────────────────────────────┤
│  Stack: [React][TS][Node][Git]...                            │
│  GitHub: @[PLACEHOLDER]  ★ 12 · 14 repo · son aktivite       │
├──────────────────────────────────────────────────────────────┤
│  CTA şeridi → Contact                           footer       │
│ 🔥 (sol alt, fixed, içerik sütununun DIŞINDA)                │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Masaüstü – Projects
```
│ Projeler                                                     │
│ Filtre: (Tümü)(Web)(Mobil)(Oyun)   Durum: [Hepsi ▾]  Ara: [ ]│
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│ │ görsel   │ │ görsel   │ │ görsel   │                       │
│ │ Başlık   │ │ Başlık   │ │ Başlık   │                       │
│ │ 2 satır  │ │ 2 satır  │ │ 2 satır  │                       │
│ │ [etiket] │ │ [etiket] │ │ [etiket] │                       │
│ │ ●Durum ★3│ │ ●Durum ★0│ │ ●Durum ★8│                       │
│ └──────────┘ └──────────┘ └──────────┘                       │
```

### 3.3 Masaüstü – Contact
```
│ Bir merhaba de.                                              │
│ ┌─ Kartlar ────────────┐  ┌─ Form ───────────────────────┐   │
│ │ ✉ e-posta            │  │ Ad     [____________]        │   │
│ │ GitHub  LinkedIn     │  │ E-posta[____________]        │   │
│ │ X  Instagram         │  │ Mesaj  [____________]        │   │
│ └──────────────────────┘  │              [Gönder]        │   │
```

### 3.4 Mobil – Home (<640px)
```
┌─────────────────────┐
│ ◉ Ad Soyad      [☰]    │ sticky; ☰ menü açar
├─────────────────────┤
│ Merhaba, ben Ad Soyad. │
│ [Rol] geliştirici.  │
│ [Projeleri Gör]     │
│ [İletişim]          │
├─────────────────────┤
│ Öne Çıkanlar        │
│ [kart – tam genişl.]│
│ [kart]  (yatay snap │
│  carousel opsiyonel)│
├─────────────────────┤
│ Stack · GitHub      │
│ CTA · footer        │
│ 🔥 (küçük, sol alt) │
└─────────────────────┘
```

### 3.5 Mobil menü (açık)
```
┌─────────────────────┐
│ ◉ Ad Soyad       [✕]   │
├─────────────────────┤
│  Home               │
│  Projects           │  tam ekran overlay,
│  About              │  büyük dokunma hedefi (≥48px)
│  Contact            │
│  ───────────        │
│  [TR | EN]  [☀/☾]   │  toggle'lar menü içinde de
│  GitHub · LinkedIn  │
└─────────────────────┘
```

---

## 4. Navigasyon

- **Sticky header**, yükseklik 64px (mobil 56px). Scroll aşağı: arka plan blur + ince alt çizgi belirir; hızlı aşağı kaydırmada küçülür (opsiyonel), yukarı kaydırmada geri gelir.
- **Sol:** logo/ad ("Ad Soyad") → `/`. **Orta/sağ:** 4 ana link. **En sağ:** dil toggle, tema toggle (bu sıra, sabit konum; mobilde de aynı sıra).
- Aktif sayfa: alt çizgi + `aria-current="page"`. `/projects/:slug` iken "Projects" aktif.
- Dil toggle: segmented kontrol `TR | EN` (kısa kod, `lang` etiketli). Tema toggle: ikon buton (güneş/ay), `aria-label` mevcut eyleme göre ("Koyu temaya geç").
- **Mobil (<768px):** hamburger → tam ekran overlay menü; açılınca focus trap, `Esc` ile kapanır, arka plan scroll kilitlenir, rota değişince otomatik kapanır. Toggle'lar menüde de; header'da yalnızca logo + hamburger (+ opsiyonel tema ikonu).
- **Skip link:** "İçeriğe geç" ilk odaklanabilir öğe.
- **Footer:** kısa sosyal ikonlar, telif, "Yukarı çık" butonu.
- Sayfa geçişi: kısa (200-300ms) fade/slide; scroll konumu rota değişiminde en üste sıfırlanır, geri tuşunda geri yüklenir.

---

## 5. Kamp Ateşi ve İçerik Akışı

Ateş = **scroll ilerleme göstergesi + atmosfer**. Sol altta `position: fixed`. Güç, sayfanın scroll yüzdesine (`0-1`) bağlıdır; her sayfada o sayfanın ilerlemesi hesaplanır.

### 5.1 Aşamalar (Home sayfası referans)
| Scroll % | Bölüm | Ateş aşaması | Görsel |
|---|---|---|---|
| 0-10 | Hero | **Kor** (ember) | Birkaç parlayan kor, çok hafif duman, yalnızca odun |
| 10-30 | Kısa tanıtım | **Kıvılcım** | Küçük alev, ara ara kıvılcım |
| 30-55 | Öne çıkan projeler | **Yanan ateş** | Orta alev, sıcak ışık halesi başlar |
| 55-80 | Stack + GitHub | **Güçlü ateş** | Büyük alev, daha çok kıvılcım |
| 80-100 | CTA / Contact şeridi | **Coşkulu ateş** | Maksimum alev, geniş ışık halesi, zeminde turuncu yansıma |

Diğer sayfalar: aynı 5 aşama kendi scroll yüzdesine göre. Kısa sayfalarda (Contact) ateş **orta aşamadan** başlar ve alt kısımda zirveye çıkar. Geri kaydırınca ateş yavaş söner (histerezis: sönme, yanmadan ~2x yavaş). Sayfa değişiminde ateş sönmez, yeni değere yumuşak geçer (tween, 600ms).

Ek etkileşim: ateşe hover/focus = küçük tooltip ("Kaydırdıkça güçlenir"); tıklama = isteğe bağlı ses yok, sadece kıvılcım patlaması. Ateş **dekoratif** (`aria-hidden`), ilerleme bilgisi için ayrıca `progressbar` verilmez (gereksiz gürültü).

### 5.2 Layout kuralları (içeriği kapatmama)
1. Ateş kutusu: masaüstü 160×200px, tablet 120×150px, mobil 72×90px; ışık halesi (glow) bunun dışına taşabilir ama `pointer-events: none`.
2. **Güvenli alan:** içerik kolonunun sol iç boşluğu masaüstünde ≥ 200px (max-width 1120px merkezli konteyner geniş ekranlarda doğal boşluk bırakır). 1024-1280px arası ateş alanı için sol padding `clamp(24px, 12vw, 200px)`.
3. Ateş **z-index: içerik altında** (arkaplan katmanı), yalnızca halesi içeriğin arkasına karışır; metin/kart asla ateşin üstüne binerse metnin kontrastı bozulmamalı (glow opaklığı ≤ 0.25 içerik arkasında).
4. **Tıklanabilir öğeler** (buton, link, form) ateşin kapladığı dikdörtgenin üstüne gelirse ateşin `pointer-events: none` olması yeterlidir; ayrıca sol-alt köşeye hizalı sabit buton **konulmaz** (geri-yukarı butonu sağ alta).
5. **Mobil:** ateş 72px, opaklık %80; içerik altına son 96px `padding-bottom` rezerve edilir; footer üzerinde ateş yarı saydam kalır. Çok dar ekranda (<360px) ateş yalnızca kor/alev ikonuna sadeleşir.
6. Footer ve form alanları ile çakışma: footer `position: relative; z-index: 2`, ateş `z-index: 0`; formlar yüksek z.
7. `prefers-reduced-motion` ve düşük performans: alev animasyonu yerine statik 5 durumlu görsel (bkz. 9).
8. Canvas/SVG üzerinde `will-change: transform`, 30-60fps sınırı, sekme gizliyken duraklat.
9. Klavye odak halkası ateşin altında kalmamalı: odaklanan öğe viewport'ta ise `scroll-padding-bottom: 120px`.

---

## 6. Projects Sayfası

### 6.1 Veri modeli (Admin Panel uyumlu)
```
Project {
  id, slug,
  title:   { tr, en },
  summary: { tr, en },
  description: { tr, en },
  status: "in-progress" | "completed" | "paused" | "planned" | "archived",
  tags: ["web","mobile","game","api","ui"],     // kategori etiketleri
  tech: ["React","TypeScript",...],
  cover, gallery[],
  links: { demo?, repo? },                       // repo: "owner/name"
  github?: { stars, language, updatedAt } ,      // API'den, cache'li
  featured: boolean, order: number, createdAt
}
```

### 6.2 Filtre / Etiket
- Üstte **etiket çipleri** (çoklu seçim değil, tek seçim + "Tümü"); yanında **durum açılır menüsü**; opsiyonel **arama kutusu** (başlık + tech).
- Filtre durumu URL query'de: `/projects?tag=web&status=in-progress` (paylaşılabilir, geri tuşu çalışır).
- Sonuç sayısı canlı bölgede duyurulur (`aria-live="polite"`: "5 proje gösteriliyor").
- Filtre değişiminde kartlar layout animasyonuyla yeniden dizilir (reduced motion'da anında).
- Sıralama: varsayılan `featured` + `order`; seçenek: En yeni / En çok yıldız.

### 6.3 Kart içeriği (üstten alta)
1. Kapak görseli (16:9, lazy, `alt` zorunlu)
2. Başlık (H3)
3. Özet (en fazla 2 satır, kırpma)
4. Tech etiketleri (en fazla 3 + "+N")
5. Alt satır: **durum rozeti** (sol) · **★ yıldız sayısı** · **dil noktası + dil adı** (sağ)
6. Tüm kart tek bir bağlantı (`/projects/:slug`); ikincil: GitHub ikon butonu (ayrı odak noktası, `aria-label`)

### 6.4 Durum rozetleri
| Durum | TR | EN | Renk (nokta + metin, yalnızca renk değil) |
|---|---|---|---|
| in-progress | Geliştiriliyor | In Progress | Amber, nabız animasyonlu nokta |
| completed | Tamamlandı | Completed | Yeşil, tik ikonu |
| paused | Beklemede | On Hold | Gri, duraklat ikonu |
| planned | Planlanıyor | Planned | Mavi, noktalı çerçeve |
| archived | Arşivlendi | Archived | Soluk gri |

Rozet her zaman **ikon + metin** taşır (renk körlüğü). Nabız animasyonu reduced motion'da durur.

### 6.5 GitHub repo verisi
- Kaynak: GitHub REST `GET /repos/{owner}/{repo}` (yıldız `stargazers_count`, `language`, `pushed_at`) ve profil için `GET /users/{user}`.
- Kimlik doğrulamasız limit 60 istek/saat → **önbellek**: `localStorage` + TTL 1 saat (stale-while-revalidate); build/admin aşamasında statik snapshot yedeği (`github` alanı veride).
- Gösterim: `★ 12`, `● TypeScript` (dil renk noktası), "Son güncelleme: 3 gün önce" (yalnız detay sayfası).
- Hata/limit: veri yoksa yıldız/dil alanları **gizlenir**, kart bozulmaz; yükleme sırasında skeleton.
- Repo olmayan proje (özel/yerel): GitHub alanı hiç render edilmez.

---

## 7. Contact ve Sosyal Linkler

Veri: `socials[] = { id, platform, label, url, icon, order, visible }` (Admin yönetir).

- **Contact sayfası:** Sol/üst: büyük e-posta kartı (kopyala butonu + `mailto:`; kopyalanınca "Kopyalandı" toast, `aria-live`). Altında sosyal kartlar grid'i (2×N): ikon + platform + kullanıcı adı, tüm kart link, `target="_blank" rel="noopener noreferrer"` ve "yeni sekmede açılır" ekran okuyucu metni.
- **Form (Faz 1):** Ad, e-posta, mesaj; satır içi doğrulama, honeypot spam alanı. Backend yoksa `mailto:` fallback veya form servisi `[PLACEHOLDER: Formspree/EmailJS]`. Gönderim durumları: boşta → gönderiliyor → başarı/hata.
- **Sosyal ikon şeridi** Header'da değil; **footer + Home CTA + mobil menü altı**.
- Öncelik sırası: E-posta, GitHub, LinkedIn, X/Twitter, Instagram, diğer. İkon yalnız kullanılırken `aria-label` zorunlu.
- Müsaitlik rozeti: "Staj/iş fırsatlarına açığım" (admin'den aç/kapa).

---

## 8. i18n ve Tema Stratejisi

### 8.1 i18n
- **Diller:** `tr` (varsayılan), `en`.
- **Dil nerede?** URL öneki: `/tr/projects`, `/en/projects` (paylaşılabilir, SEO/hreflang, hoca linki doğrudan dilde açar). `/` → algılanan dile yönlendirir. Header toggle aynı sayfanın diğer dil URL'ine geçer. (Alternatif: yalnız state — reddedildi: link paylaşımında dil kaybolur.)
- **Varsayılan dil algılama sırası:** (1) URL öneki → (2) `localStorage['lang']` → (3) `navigator.languages` ilk eşleşen (`tr*` → tr, `en*` → en) → (4) `tr`.
- **Kalıcılık:** Kullanıcı toggle'ı kullanırsa `localStorage['lang']` yazılır; `<html lang>` güncellenir; `document.title` ve meta dile göre değişir.
- **Anahtar yapısı** (iki katman):
  - `ui` sözlükleri (`locales/tr.json`, `en.json`): sayfa/bileşen bazlı, nokta ayrımlı, anlamlı anahtarlar.
    ```
    nav.home | nav.projects | nav.about | nav.contact
    theme.toLight | theme.toDark | lang.switchTo
    home.hero.greeting | home.hero.role | home.hero.tagline | home.hero.cta.projects
    projects.title | projects.filter.all | projects.status.inProgress
    projects.empty | projects.error.retry
    about.bio | about.timeline.title
    contact.title | contact.form.name | contact.form.success
    common.loading | common.error | a11y.skip | a11y.opensNewTab
    ```
  - `content` verisi (projeler, sosyaller, biyografi): çok dilli alanlar `{ tr, en }` nesnesi. Admin panel bunları doğrudan düzenler; dil eksikse **EN → TR fallback**, görünür uyarı yok ama admin'de "çeviri eksik" işareti.
- Çoğul/tarih/sayı: `Intl.PluralRules`, `Intl.DateTimeFormat(lang)`, `Intl.RelativeTimeFormat`. Metin genişlemesi için buton/ başlıklar %30 esnek tasarlanır (TR genelde daha uzun).
- Çevrilmemiş anahtar: geliştirmede konsol uyarısı, üretimde TR fallback; anahtar adı asla ekranda görünmez.

### 8.2 Tema
- Değerler: `light`, `dark`; kullanıcı seçimi yoksa **sistem** (`prefers-color-scheme`). Toggle iki durumludur; seçim yapılınca `localStorage['theme']` yazılır, sistem değişse bile seçim korunur. (Opsiyonel: "Sistem" üçüncü seçeneği ayarlarda.)
- Uygulama: `<html data-theme="dark|light">`, renkler CSS özel değişkenleriyle (tokens). `color-scheme` meta + CSS ile form/scrollbar uyumu.
- **FOUC önleme:** `<head>` içinde, CSS'ten ÖNCE, bloklayan küçük satır içi script: `localStorage` oku → yoksa `matchMedia` → `data-theme`'i `<html>`'e yaz. Hata olursa (`try/catch`) sistem tercihi. Aynı mantık dil için (`lang` attr). Geçiş animasyonu ilk yüklemede kapalı, yalnız toggle sonrası 250ms renk geçişi.
- Ateş ve ışık hesabı: koyu temada hale belirgin (ana atmosfer), açık temada hale azalır, alev renkleri daha doygun; her iki temada kontrast kontrolü yapılır.
- Koyu palet önerisi: zemin `#0f1115`, yüzey `#171a21`, metin `#e8e6e3`, vurgu `#ff7a1a`. Açık: zemin `#faf8f5`, yüzey `#ffffff`, metin `#1c1b1a`, vurgu `#d9560a` (kontrast için koyulaştırılmış).

---

## 9. Erişilebilirlik (WCAG 2.2 AA hedefi)

- **Klavye:** Tüm etkileşim Tab ile; mantıklı odak sırası (skip link → header → içerik → footer). Mobil menü ve modal'larda focus trap + `Esc`. Filtre çipleri `button` + `aria-pressed`. Ok tuşları gerekmez (basit tab akışı).
- **Odak göstergesi:** `:focus-visible` ile 2px vurgu halkası + 2px offset, her iki temada ≥3:1 kontrast; fare tıklamasında gösterilmez. Odak asla yapışkan header altında kalmaz (`scroll-padding-top: 80px`).
- **Reduced motion:** `prefers-reduced-motion: reduce` → scroll animasyonları, parallax, geçişler kapanır (içerik direkt görünür); ateş **statik 5 durumlu** görsele döner (scroll aşamasına göre görsel değişir ama hareketsiz); rozet nabzı durur; özel imleç takip gecikmesi kaldırılır. Sitede ayrıca elle "Animasyonları azalt" anahtarı (footer) sunulur.
- **Özel imleç:** Yalnızca `(pointer: fine)` ve `hover: hover` cihazlarda. Gerçek imleç **gizlenmez** ihtiyaç halinde: sistem imleci `cursor:none` yapılırsa özel imleç her zaman render edilir; yedek olarak JS başarısızsa sistem imleci kalır. Özel imleç `aria-hidden`, `pointer-events:none`; yalnızca küçük nokta + halka; tıklanabilir öğe üzerinde büyür ama **hedef boyutunu/alanını değiştirmez**. Dokunmatik cihazlarda tamamen kapalı. Kullanıcı tercihi: footer'da "Özel imleci kapat" anahtarı (`localStorage`). Yüksek kontrast modunda (`forced-colors`) kapalı. İmleç, metin üzerinde seçilebilirliği engellemez.
- **Kontrast:** Metin ≥ 4.5:1, büyük metin/UI bileşenleri ≥ 3:1, her iki temada; görsel üstü metin için yarı saydam taban katman. Vurgu rengiyle yazılan küçük metin açık temada koyu varyantla.
- **Anlamsal yapı:** `header/nav/main/footer`, tek `h1`/sayfa, mantıklı başlık hiyerarşisi; rota değişiminde odak `h1`'e taşınır ve `document.title` güncellenir (ekran okuyucu duyurusu).
- **Görseller:** anlamlı `alt` (içerik veri alanı, her dil için), dekoratif `alt=""`. Ateş ve dekor `aria-hidden`.
- **Formlar:** görünür `label`, hata mesajı `aria-describedby`, `aria-invalid`, zorunlu işareti metinle.
- **Hedef boyut:** dokunmatik ≥ 44×44px.
- **Çok dillilik:** dil değişince `lang` attr; inline yabancı ifadeye `lang`.
- **Hareket güvenliği:** Yanıp sönen içerik yok (saniyede 3'ten fazla flaş yasak).

---

## 10. Responsive Kırılımlar

| Ad | Aralık | Grid | Notlar |
|---|---|---|---|
| xs | <480px | 1 kolon | Ateş 72px; menü hamburger; kartlar tam genişlik |
| sm | 480-767px | 1 kolon (kart yatay opsiyonel) | Ateş 80px |
| md | 768-1023px | 2 kolon | Tablet; header link'leri satır içi, ateş 120px |
| lg | 1024-1439px | 3 kolon | Tam masaüstü; ateş 160×200 |
| xl | ≥1440px | 3 kolon, max-width 1120-1200px merkezli | Yan boşluklar genişler; ateş rahat alan |

Kurallar: mobil-önce CSS; akışkan tipografi (`clamp`); gövde satır uzunluğu 60-75 karakter; yatay scroll yok; yön (landscape) telefonda ateş küçülür; dokunmatik cihazda hover'a bağımlı bilgi yok.

---

## 11. Boş / Yükleme / Hata Durumları

| Bağlam | Yükleme | Boş | Hata |
|---|---|---|---|
| Proje listesi | 6 skeleton kart (shimmer; reduced motion'da statik) | "Henüz proje yok, yakında!" + ateş illüstrasyonu | "Projeler yüklenemedi" + [Tekrar dene] |
| Filtre sonucu | — | "Bu filtreye uygun proje yok" + [Filtreleri temizle] | — |
| GitHub verisi | Yıldız/dil yerinde skeleton | Alan gizlenir | Alan gizlenir (sessiz), konsol log; limitte "Önbellekteki veri" notu |
| Proje detay | İskelet başlık+görsel | — | Bulunamadı: 404 sayfası + Projeler linki |
| Contact formu | Buton "Gönderiliyor…", disabled | — | Alan hataları satır içi; sunucu hatası: üstte uyarı + mailto alternatifi |
| Görsel | Düşük kalite blur placeholder | Gradient zemin + ikon | Yedek ikon, düzen kaymaz (sabit en-boy oranı) |
| Genel (JS/ağ) | Sayfa yükleniyor: ince üst progress bar | — | Hata sınırı: "Bir şeyler ters gitti" + yenile; `<noscript>`: statik temel içerik + e-posta |
| 404 | — | — | "Yol kayboldu. Ateşin yanına dön." + Ana sayfa butonu |
| Çevrimdışı | — | — | Banner: "Çevrimdışısın, kayıtlı veri gösteriliyor" |

Tüm durumlar iki dilde, düzen kaymasını (CLS) önlemek için sabit boyutlu yer tutucular.

---

## 12. Placeholder İçerik Metinleri (TR / EN)

Kullanıcı adı: **Ad Soyad**. Diğer her şey `[PLACEHOLDER]`.

### 12.1 Home – Hero
| Anahtar | TR | EN |
|---|---|---|
| home.hero.greeting | Merhaba, ben Ad Soyad. | Hi, I'm Ad Soyad. |
| home.hero.role | [PLACEHOLDER: rol, örn. Yazılım geliştirici] | [PLACEHOLDER: role, e.g. Software developer] |
| home.hero.tagline | [PLACEHOLDER: tek cümlelik slogan] – ateşin başında fikirleri koda döküyorum. | [PLACEHOLDER: one-line tagline] – turning ideas into code by the fire. |
| home.hero.cta.projects | Projeleri Gör | View Projects |
| home.hero.cta.contact | İletişime Geç | Get in Touch |

### 12.2 Home – Diğer bölümler
| Anahtar | TR | EN |
|---|---|---|
| home.intro.text | [PLACEHOLDER: 2-3 cümle tanıtım]. [PLACEHOLDER: okul/bölüm] öğrencisiyim ve [PLACEHOLDER: ilgi alanı] üzerine projeler geliştiriyorum. | [PLACEHOLDER: 2-3 sentence intro]. I'm a [PLACEHOLDER: school/major] student building projects around [PLACEHOLDER: interest]. |
| home.featured.title | Öne Çıkan Projeler | Featured Projects |
| home.featured.all | Tüm projeler | All projects |
| home.skills.title | Teknolojiler | Tech Stack |
| home.github.title | GitHub'da | On GitHub |
| home.github.stats | [PLACEHOLDER: N] repo · [PLACEHOLDER: N] takipçi | [PLACEHOLDER: N] repos · [PLACEHOLDER: N] followers |
| home.cta.title | Birlikte bir şey yapalım. | Let's build something together. |
| home.cta.button | Bana yaz | Write to me |

### 12.3 Projects
| Anahtar | TR | EN |
|---|---|---|
| projects.title | Projeler | Projects |
| projects.subtitle | Geliştirdiğim ve geliştirmekte olduğum çalışmalar. | Things I've built and am still building. |
| projects.filter.all | Tümü | All |
| projects.filter.status | Durum | Status |
| projects.search | Proje ara | Search projects |
| projects.count | {count} proje gösteriliyor | Showing {count} projects |
| projects.empty | Henüz proje yok, yakında! | No projects yet, stay tuned! |
| projects.emptyFilter | Bu filtreye uygun proje yok. | No projects match this filter. |
| projects.error | Projeler yüklenemedi. | Couldn't load projects. |
| projects.retry | Tekrar dene | Try again |
| projects.viewRepo | GitHub'da görüntüle | View on GitHub |
| projects.liveDemo | Canlı demo | Live demo |
| projects.status.inProgress | Geliştiriliyor | In Progress |
| projects.status.completed | Tamamlandı | Completed |
| projects.status.paused | Beklemede | On Hold |
| projects.status.planned | Planlanıyor | Planned |
| projects.status.archived | Arşivlendi | Archived |

Örnek proje (veri):
- slug `[PLACEHOLDER: proje-adi]`; title TR `[PLACEHOLDER: Proje Adı]` / EN `[PLACEHOLDER: Project Name]`; summary TR `[PLACEHOLDER: iki satırlık özet]` / EN `[PLACEHOLDER: two-line summary]`; status `in-progress`; tech `[PLACEHOLDER]`; repo `[PLACEHOLDER: kullanici/repo]`.

### 12.4 About
| Anahtar | TR | EN |
|---|---|---|
| about.title | Hakkımda | About Me |
| about.bio | Ben Ad Soyad. [PLACEHOLDER: biyografi, 2 paragraf: nereden geldiğin, ne öğrendiğin, ne yapmak istediğin]. | I'm Ad Soyad. [PLACEHOLDER: 2-paragraph bio: where you're from, what you've learned, what you want to do]. |
| about.timeline.title | Yolculuk | Journey |
| about.timeline.item | [PLACEHOLDER: yıl] – [PLACEHOLDER: okul / iş / olay] | [PLACEHOLDER: year] – [PLACEHOLDER: school / job / event] |
| about.skills.title | Yetenekler | Skills |
| about.interests.title | Ateş başında | By the Fire |
| about.interests.text | [PLACEHOLDER: hobiler, ilgi alanları] | [PLACEHOLDER: hobbies, interests] |
| about.cv | CV'mi indir | Download my CV |

### 12.5 Contact
| Anahtar | TR | EN |
|---|---|---|
| contact.title | İletişim | Contact |
| contact.subtitle | Bir merhaba demek için yazabilirsin. | Feel free to say hi. |
| contact.availability | [PLACEHOLDER: Staj / iş fırsatlarına açığım] | [PLACEHOLDER: Open to internships / opportunities] |
| contact.email | [PLACEHOLDER: e-posta adresi] | [PLACEHOLDER: email address] |
| contact.copy | E-postayı kopyala | Copy email |
| contact.copied | Kopyalandı | Copied |
| contact.form.name | Adın | Your name |
| contact.form.email | E-posta | Email |
| contact.form.message | Mesajın | Message |
| contact.form.send | Gönder | Send |
| contact.form.sending | Gönderiliyor… | Sending… |
| contact.form.success | Teşekkürler! En kısa sürede dönerim. | Thanks! I'll get back to you soon. |
| contact.form.error | Gönderilemedi. Lütfen e-postayla dene. | Couldn't send. Please try email instead. |
| contact.form.required | Bu alan zorunlu. | This field is required. |

Sosyal linkler (veri): GitHub `[PLACEHOLDER: github.com/kullanici]`, LinkedIn `[PLACEHOLDER]`, X `[PLACEHOLDER]`, Instagram `[PLACEHOLDER]`.

### 12.6 Genel / Sistem
| Anahtar | TR | EN |
|---|---|---|
| nav.home / projects / about / contact | Ana Sayfa / Projeler / Hakkımda / İletişim | Home / Projects / About / Contact |
| theme.toDark | Koyu temaya geç | Switch to dark theme |
| theme.toLight | Açık temaya geç | Switch to light theme |
| lang.switchTo | English'e geç | Türkçe'ye geç |
| a11y.skip | İçeriğe geç | Skip to content |
| a11y.opensNewTab | (yeni sekmede açılır) | (opens in new tab) |
| menu.open / menu.close | Menüyü aç / Menüyü kapat | Open menu / Close menu |
| fire.tooltip | Kaydırdıkça güçlenir | Grows as you scroll |
| common.loading | Yükleniyor… | Loading… |
| common.error | Bir şeyler ters gitti. | Something went wrong. |
| common.offline | Çevrimdışısın, kayıtlı veri gösteriliyor. | You're offline, showing saved data. |
| notFound.title | Yol kayboldu. | You've wandered off. |
| notFound.text | Aradığın sayfa yok. Ateşin yanına dönelim. | That page doesn't exist. Let's head back to the fire. |
| notFound.cta | Ana sayfaya dön | Back to home |
| footer.copy | © {year} Ad Soyad. Tüm hakları saklıdır. | © {year} Ad Soyad. All rights reserved. |
| footer.toTop | Yukarı çık | Back to top |
| settings.reduceMotion | Animasyonları azalt | Reduce motion |
| settings.customCursor | Özel imleç | Custom cursor |

---

## Ek: Admin Panel'e Hazırlık Notları
- Tüm içerik tek şema altında: `site` (hero, about, ayarlar), `projects[]`, `socials[]`, `skills[]`, `timeline[]`. UI bileşenleri sadece bu verileri okur, sabit metin yok (UI sözlüğü hariç).
- Alanlarda `visible`, `order`, `featured` bayrakları: admin görünürlük/sıra yönetebilsin.
- İlk faz: JSON dosyaları (`content/*.json`); sonra API'ye geçişte aynı şekil korunur.
