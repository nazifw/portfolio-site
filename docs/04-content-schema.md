# 04 - İçerik Şeması (güncel)

Bu belge, sitenin **tek doğruluk kaynağı** olan `site/data/content.js` dosyasının kesin şemasıdır. Yerel admin paneli bu belgeyi girdi olarak kullanır. (Eski tasarım: `03-backend-content.md`, geçersizdir.)

## 1. Dosya biçimi

```
/* content.js: tek dogruluk kaynagi ... (tek satirlik yorum basligi) */
window.SITE_CONTENT = {
  ...JSON gövdesi, 2 boşluk girinti...
};
```

- İlk satır tek satırlık `/* ... */` yorumudur. Sonraki satır `window.SITE_CONTENT = ` ile başlar, gövde **geçerli JSON**dur (çift tırnaklı anahtarlar, sonda virgül yok, yorum yok), son karakterler `};` + satır sonudur.
- Okuma (Node): dosyayı oku, `^window\.SITE_CONTENT\s*=\s*` eşleşmesinden sonrasını al, sondaki `;` ve boşlukları at, `JSON.parse`. (Başlık yorumu bu ifadeyi içermez.)
- Yazma: `'/* ' + başlıkMetni + ' */\nwindow.SITE_CONTENT = ' + JSON.stringify(obj, null, 2) + ';\n'`. Mevcut dosya bu çıktıyla bayt bayt aynıdır (gidiş-dönüş testi geçer).
- Sayfalar dosyayı `<script src="data/content.js"></script>` ile `<head>` içinde, her şeyden önce yükler. `file://` ile çalışır; fetch/module yoktur.
- UTF-8, BOM yok. Dosyaya yalnızca bu atama yazılır; başka kod eklenmez.

## 2. Tipler

| Tip | Anlam |
|---|---|
| `L` (localized) | `{ "tr": "...", "en": "..." }`. Aktif dildeki değer boş/yoksa `tr` kullanılır. Admin her iki alanı da göstermeli; `tr` zorunlu önerilir. Render düz string de kabul eder (her dilde aynı metin) ama admin her zaman `{tr,en}` yazmalıdır. |
| `string` | Dilden bağımsız metin (URL, yol, id, saat, e-posta...). |
| `path` | `site/` köküne göre göreli görsel yolu, örn. `img/uploads/foto.jpg`. Başında `/` veya `../` olmaz. |
| `tag` | `string` ya da `L`. Aynı etiket `tr` değeriyle (string ise kendisiyle) eşleştirilir. |

`id`: her koleksiyonda benzersiz, küçük harf/rakam/tire/alt çizgi, değişmez (örn. `proj-1`, `post-3`). Silinen bir id yeniden kullanılmamalıdır.

## 3. Üst düzey alanlar

| Anahtar | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `site` | nesne | evet | Kimlik bilgileri. |
| `bio` | `L[]` | hayır | Paragraf dizisi (hakkımda; ana sayfada ilk 2). |
| `contact` | nesne | evet | İletişim bilgileri. |
| `socials` | nesne[] | hayır | Sosyal bağlantılar. |
| `skills` | nesne[] | hayır | Yetenekler (çubuk/halka). |
| `interests` | nesne[] | hayır | İlgi alanları (sırasız; ana sayfada ilk 5). |
| `priorities` | nesne[] | hayır | Öğrenme öncelikleri (sıralı liste). |
| `schedule` | nesne[] | hayır | Ders programı tablosu. |
| `timeline` | nesne[] | hayır | Özgeçmiş / eğitim zaman çizelgesi. |
| `process` | nesne[] | hayır | Projeler sayfasındaki "çalışma süreci" adımları. |
| `tools` | nesne[] | hayır | Projeler sayfasındaki araç etiketleri. |
| `principles` | nesne | hayır | Hakkımda "çalışma prensibim" bölümü (bloklarla). |
| `blogNote` | nesne | hayır | Blog sayfası alt notu. |
| `faq` | nesne[] | hayır | İletişim sayfası sık sorulan sorular. |
| `projects` | nesne[] | evet (boş olabilir) | Projeler. |
| `posts` | nesne[] | evet (boş olabilir) | Blog yazıları. |
| `gallery` | nesne[] | evet (boş olabilir) | Galeri. |
| `settings` | nesne | evet | Site ayarları. |

Zorunlu olmayan bir alan/koleksiyon yoksa ya da boşsa ilgili bölüm gizlenir (alt sayfalar) veya kibar bir boş-durum mesajı gösterilir (ana sayfa ve ana listeler). Hiçbir durumda sayfa kırılmaz.

### 3.1 `site`

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `name` | L | evet | Marka/kişi adı (header, footer, başlıklar). |
| `role` | L | hayır | Ana sayfa üst etiketi (örn. "Computer Engineering student"). |
| `tagline` | L | hayır | Ana sayfa ana cümlesi (lead). |
| `university` | L | hayır | Üst etikette role eklenir. |
| `department` | L | hayır | "Bölüm" künyesi. |
| `year` | L | hayır | "Sınıf" künyesi. |
| `city` | L | hayır | "Şehir" künyesi, footer. |
| `avatar` | path | hayır | Portre görseli (oran 3:4, önerilen 600x800). Boşsa portre bloğu gizlenir. |
| `avatarAlt` | L | hayır | Portre alt metni. |
| `avatarCaption` | L | hayır | Hakkımda'da portre altı yazı. |

### 3.2 `contact`

| Alan | Tip | Açıklama |
|---|---|---|
| `email` | string | Geçerli e-posta. Form `mailto:` eylemi, kopyala düğmesi ve footer buradan gelir. |
| `phone` | string | Serbest biçim; `tel:` bağlantısı rakam ve `+` karakterlerinden üretilir. |
| `address` | L | Adres. |
| `responseTime` | L | Hakkımda değil İletişim sayfasında "Yanıt süresi". |
| `mapUrl` | string | Opsiyonel `http(s)` harita bağlantısı. Boşsa gösterilmez. |

Boş alan = satır gösterilmez.

### 3.3 `socials[]`

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | string | evet | Benzersiz. |
| `label` | L | evet | Görünen ad. |
| `url` | string | evet | `https://`, `http://`, `mailto:` veya `tel:`. `javascript:`/`data:` reddedilir. |
| `icon` | string | hayır | `github`, `linkedin`, `mail`, `x`, `instagram`, `youtube`; başka değer = genel bağlantı simgesi. |

Footer, Hakkımda ve İletişim sayfasında listelenir.

### 3.4 `skills[]`

`{ id, label: L, percent: 0-100 tam sayı, type: "bar" | "ring" }`. `bar` (varsayılan) = yüzde çubuğu, `ring` = halka (kişisel yetkinlikler). Sıra dizideki sıradır; ana sayfada ilk 4 çubuk gösterilir.

### 3.5 `interests[]`, `priorities[]`

`{ id, text: L }`.

### 3.6 `schedule[]`

`{ id, day: L, time: string, course: L, room: string }` (örn. `time: "09:00 – 12:00"`). Dizideki sırayla tabloya yazılır.

### 3.7 `timeline[]`

`{ id, period: L, title: L, place: L, text: L }`. Paragraf = `place` ve `text` (ikisi de doluysa " · " ile birleşir). Dizideki sırayla yazılır.

### 3.8 `process[]`, `tools[]`, `faq[]`

- `process`: `{ id, title: L, text: L }`
- `tools`: `{ id, label: L }`
- `faq`: `{ id, q: L, a: L }`

### 3.9 `principles`, `blogNote`

- `principles`: `{ title: L, blocks: Block[] }` (blok tipleri bölüm 5).
- `blogNote`: `{ title: L, text: L }`.

### 3.10 `projects[]`

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | string | evet | Benzersiz. |
| `slug` | string | evet | Benzersiz; `^[a-z0-9]+(-[a-z0-9]+)*$`. Kart bağlantısı `projeler.html#slug`. |
| `title` | L | evet | |
| `summary` | L | evet | Kartta gösterilen kısa metin (1-2 cümle). |
| `description` | L | hayır | Uzun açıklama. Şablon kartlarında şu an gösterilmez; ileride detay görünümü için ayrılmıştır. |
| `image` | path | evet | Kapak, oran 4:3 (önerilen 800x600). |
| `imageAlt` | L | önerilir | Alt metin; yoksa başlık kullanılır. |
| `meta` | L | hayır | Kart alt satırı (örn. "Week 3 · Core principles"). Yoksa etiketler " · " ile birleşir. |
| `tags` | tag[] | hayır | Filtre etiketleri. |
| `status` | `"done"` \| `"wip"` \| `"planned"` | evet | Rozet: Tamamlandı / Devam ediyor / Planlanıyor. |
| `links` | `{ github?, demo? }` | hayır | `http(s)` URL'leri; yalnızca Projeler sayfasında. |
| `featured` | boolean | evet | `true` ise ana sayfada (en çok 3). Hiçbiri `true` değilse ilk 3 proje gösterilir. |
| `order` | sayı | evet | Küçükten büyüğe sıralama. |
| `visible` | boolean | evet | `false` = hiçbir yerde gösterilmez. |

### 3.11 `posts[]`

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | string | evet | Benzersiz. |
| `slug` | string | evet | Benzersiz, `^[a-z0-9]+(-[a-z0-9]+)*$`. Adres: `post.html?slug=<slug>`. |
| `title` | L | evet | Sayfa `<title>` ve h1. |
| `excerpt` | L | evet | Liste özeti ve meta description. |
| `cover` | path | evet | Kapak, oran 16:9 (önerilen 1200x675). |
| `coverAlt` | L | önerilir | |
| `coverCaption` | L | hayır | Yazı sayfasında görsel altı. |
| `date` | string | evet | `YYYY-MM-DD`. Liste yeniden eskiye sıralanır. Tarih dile göre biçimlenir. |
| `readMinutes` | sayı | hayır | Okuma süresi; yoksa bloklardan hesaplanır (en az 1). |
| `tags` | tag[] | hayır | Yazı sayfasında rozet, blog sayfasında "Konular". |
| `visible` | boolean | evet | `false` = listelerde yok ve `post.html?slug=` 404 gösterir. |
| `blocks` | Block[] | evet | İçerik (bölüm 5). |

`slug` yok/bulunamaz/gizli ise 404 görünümü ("Yazı bulunamadı" + Blog'a dön) çizilir.

### 3.12 `gallery[]`

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | string | evet | Benzersiz. |
| `image` | path | evet | Oran 4:3 (önerilen 800x600; lightbox aynı dosyayı açar, bu yüzden en fazla 1600 px genişlik önerilir). |
| `title` | L | hayır | Başlık; `caption`/`alt` yoksa yedek. |
| `alt` | L | önerilir | Alt metin. |
| `caption` | L | hayır | Görsel altı yazı ve lightbox altyazısı. |
| `group` | L | hayır | Aynı `group` değerine (aktif dil metni) sahip kareler başlıklı bir bölümde toplanır; grup sırası ilk görülme sırasıdır. Hiç `group` yoksa tek, başlıksız ızgara. |
| `order` | sayı | evet | Sıralama. |
| `visible` | boolean | evet | |

Ana sayfa galerisi ilk 4 görünür kareyi gösterir.

### 3.13 `settings`

| Alan | Tip | Açıklama |
|---|---|---|
| `defaultLang` | `"tr"` \| `"en"` | Kullanıcının kayıtlı tercihi yoksa açılış dili. |
| `defaultTheme` | `"dark"` \| `"light"` \| `"system"` | Kayıtlı tercih yoksa tema; `system` = işletim sistemi. |
| `fire` | boolean | `false` ise ateş animasyonu başlamaz. |
| `cursor` | boolean | `false` ise özel imleç başlamaz. |
| `accentOverride` | string | Opsiyonel vurgu rengi: `#rgb`/`#rrggbb`/`#rrggbbaa`, `rgb()/rgba()/hsl()/hsla()`. Boş = tema varsayılanı. |
| `siteTitle` | L | Ana sayfa `<title>`. Diğer sayfalar "Sayfa adı \| site.name". |
| `siteDescription` | L | Ana sayfa meta description. |
| `githubUsername` | string | Opsiyonel; şu an yalnızca saklanır (ileride GitHub entegrasyonu). |

## 4. Dosya ve görsel kuralları

- Tüm görsel yolları `site/` köküne göredir ve `site/img/` altında olmalıdır. Yüklemeler `site/img/uploads/` altına yazılır (örn. `img/uploads/2026-10-foto.jpg`).
- Dosya adı: küçük harf, rakam, tire, nokta; boşluk ve Türkçe karakter yok. Çakışmada sonek ekle.
- İzinli türler: `svg`, `png`, `jpg/jpeg`, `webp`, `avif`, `gif`.
- Önerilen boyutlar: portre 600x800 (en fazla 300 KB), proje/galeri 800x600 (en fazla 250 KB, lightbox için 1600 px'e kadar çıkabilir, en fazla 600 KB), blog kapağı 1200x675 (en fazla 300 KB). Tek dosya için üst sınır 2 MB.
- Sayfalar görselleri `width`/`height` ile ve `loading="lazy"` olarak yazar; oranı bozmamak için önerilen oranları koru (CSS `object-fit: cover`).

## 5. Blok tipleri (`posts[].blocks`, `principles.blocks`)

İçerik HTML değil yapılandırılmış bloktur. Render yalnızca `textContent`/`createElement` kullanır; metinde HTML yazılsa bile düz metin görünür (XSS güvenli).

| `type` | Alanlar | Çıktı |
|---|---|---|
| `heading` | `text: L`, `level?: 2 \| 3` (varsayılan 2) | `h2`/`h3` |
| `paragraph` | `text: L`, `lead?: boolean` | `p` (`lead: true` giriş paragrafı) |
| `image` | `src: path`, `alt: L`, `caption?: L`, `width?`, `height?` (varsayılan 1200x675) | `figure > img + figcaption` |
| `code` | `code: string`, `language?: string` | `pre > code` (satır sonları `\n`) |
| `quote` | `text: L`, `cite?: L` | `blockquote` |
| `list` | `items: L[]`, `ordered?: boolean` | `ul`/`ol` |

Yazıda sayfanın tek h1'i başlıktır; `heading` blokları h2/h3 üretir. Bilinmeyen `type` yok sayılır.

## 6. Örnek JSON (kısaltılmış)

```json
{
  "site": {
    "name": { "tr": "Name", "en": "Name" },
    "role": { "tr": "Yazılım öğrencisi", "en": "Software student" },
    "tagline": { "tr": "Kısa tanıtım cümlesi.", "en": "A short intro sentence." },
    "avatar": "img/portrait.svg",
    "avatarAlt": { "tr": "Portre", "en": "Portrait" }
  },
  "bio": [ { "tr": "Birinci paragraf.", "en": "First paragraph." } ],
  "contact": { "email": "name@example.com", "phone": "+00 000 000 00 00",
    "address": { "tr": "Örnek Sokak 1", "en": "1 Example Street" }, "mapUrl": "" },
  "socials": [ { "id": "github", "label": { "tr": "GitHub", "en": "GitHub" }, "url": "https://github.com/example", "icon": "github" } ],
  "skills": [ { "id": "html", "label": { "tr": "HTML", "en": "HTML" }, "percent": 90, "type": "bar" } ],
  "projects": [ {
    "id": "proj-1", "slug": "ilk-proje",
    "title": { "tr": "İlk proje", "en": "First project" },
    "summary": { "tr": "Kısa özet.", "en": "Short summary." },
    "image": "img/proj-1.svg", "imageAlt": { "tr": "Görsel", "en": "Image" },
    "tags": ["Web", { "tr": "Tasarım", "en": "Design" }],
    "status": "wip", "links": { "github": "https://github.com/example/repo" },
    "featured": true, "order": 1, "visible": true
  } ],
  "posts": [ {
    "id": "post-1", "slug": "ilk-yazi",
    "title": { "tr": "İlk yazı", "en": "First post" },
    "excerpt": { "tr": "Özet.", "en": "Excerpt." },
    "cover": "img/blog-1.svg", "coverAlt": { "tr": "Kapak", "en": "Cover" },
    "date": "2026-10-12", "tags": [ { "tr": "Web", "en": "Web" } ], "visible": true,
    "blocks": [
      { "type": "paragraph", "lead": true, "text": { "tr": "Giriş.", "en": "Intro." } },
      { "type": "heading", "text": { "tr": "Başlık", "en": "Heading" } },
      { "type": "code", "language": "bash", "code": "git init" },
      { "type": "list", "ordered": false, "items": [ { "tr": "Bir", "en": "One" } ] }
    ]
  } ],
  "gallery": [ { "id": "gal-1", "image": "img/gal-1.svg", "alt": { "tr": "Alt", "en": "Alt" },
    "caption": { "tr": "Açıklama", "en": "Caption" }, "group": { "tr": "Doğa", "en": "Nature" }, "order": 1, "visible": true } ],
  "settings": { "defaultLang": "tr", "defaultTheme": "system", "fire": true, "cursor": true,
    "accentOverride": "", "siteTitle": { "tr": "Name | Portfolyo", "en": "Name | Portfolio" },
    "siteDescription": { "tr": "Açıklama.", "en": "Description." }, "githubUsername": "" }
}
```

Tam ve çalışan örnek: `site/data/content.js`.

## 7. Doğrulama kuralları (JSON-şeması benzeri)

Admin paneli kaydetmeden önce şunları denetlemeli; ihlalde kaydı reddet ve alan adıyla hata ver.

**Genel**
1. Kök nesne; `site`, `contact`, `settings` nesne; `projects`, `posts`, `gallery` dizi olmalı (boş olabilir). Diğer koleksiyonlar yoksa boş dizi/atlanmış kabul edilir.
2. Bilinmeyen üst düzey anahtarlar korunur (silme), ama düzenlenemez.
3. Her `L` alanı `{tr: string, en: string}` olmalı; `tr` boş olamaz (zorunlu alanlarda); `en` boş olabilir (tr'ye düşer).
4. Her koleksiyonda `id` dolu, `^[a-z0-9][a-z0-9_-]*$`, koleksiyon içinde benzersiz.
5. Dizelerde kontrol karakteri (\u0000-\u0008, \u000B, \u000C, \u000E-\u001F) olmamalı. Tek tek metin en çok 20 000 karakter (blok `code` en çok 50 000).

**Alan kuralları**

| Alan | Kural |
|---|---|
| `site.name` | zorunlu, 1-80 karakter |
| `contact.email` | boş ya da `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` |
| `contact.mapUrl`, `socials[].url`, `projects[].links.*` | boş ya da `^(https?:\/\/\|mailto:\|tel:)` (links ve mapUrl yalnız `https?://`); `javascript:`, `data:`, `vbscript:` yasak |
| `projects[].slug`, `posts[].slug` | `^[a-z0-9]+(-[a-z0-9]+)*$`, 1-80 karakter, kendi koleksiyonunda benzersiz |
| `projects[].status` | `done`, `wip`, `planned` |
| `projects[].order`, `gallery[].order` | sonlu sayı |
| `visible`, `featured`, `settings.fire`, `settings.cursor` | boolean |
| `skills[].percent` | 0-100 tam sayı; `type` yoksa `bar`, değilse `bar`/`ring` |
| `posts[].date` | `^\d{4}-\d{2}-\d{2}$` ve geçerli takvim tarihi |
| `posts[].readMinutes` | boş ya da 1-600 tam sayı |
| görsel alanları (`image`, `cover`, `avatar`, blok `src`) | boş (opsiyonelse) ya da `^img\/[A-Za-z0-9._\/-]+\.(svg\|png\|jpe?g\|webp\|avif\|gif)$`; `..` ve `//` içeremez; dosya `site/` altında bulunmalı |
| `settings.defaultLang` | `tr` / `en` |
| `settings.defaultTheme` | `dark` / `light` / `system` |
| `settings.accentOverride` | boş ya da `^#[0-9a-fA-F]{3,8}$` ya da `^(rgb\|hsl)a?\([0-9 ,.%\/]+\)$` |
| `blocks[].type` | `heading`, `paragraph`, `image`, `code`, `quote`, `list` |
| `blocks[]` alanları | bölüm 5'teki tabloya uy: `image.src` zorunlu; `code.code` string; `list.items` dizi; `heading.level` yalnız 2 ya da 3 |

**Anlamsal**
- Bir yazı `visible: true` iken en az bir `title.tr`, `excerpt.tr` ve `date` taşımalı.
- Slug değişirse eski `post.html?slug=` bağlantıları 404 olur; admin uyarı göstermeli.
- Bir görsel dosyası silinirse onu kullanan alanlar temizlenmeli veya kullanıcı uyarılmalı.
- Kayıt atomik olmalı: geçici dosyaya yaz, JSON'u yeniden parse ederek doğrula, sonra yeniden adlandır.

## 8. Arayüz metinleri (içerik değil)

Menü, düğme, form hataları, durum rozeti etiketleri, boş-durum mesajları ve sayfa başlık kalıpları `site/js/i18n.js` içindedir; bu dosya admin tarafından düzenlenmez. Dil değişimi `window` üzerinde `langchange` olayını yayınlar; `site/js/render.js` içeriği yeniden çizer.
