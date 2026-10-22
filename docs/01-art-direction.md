# 01 – Art Direction: "Ember" Portfolyo

Sürüm 1.0 · Tek kaynak: tüm renk, ölçü ve hareket değerleri bu dosyadaki token'lardır. Geliştirme sırasında CSS custom property olarak birebir kullanılacak.

---

## 1. Konsept ve Mood

**Konsept: "Gece yarısı kamp, sayfa boyunca yanan bir ateş."**
Site bir yolculuktur: okuyucu aşağı indikçe ateş büyür, yani ziyaretçinin ilgisi ve zaman, ateşin enerjisine dönüşür. Ateş dekor değil, **ilerleme göstergesidir** (scroll progress bar yerine geçer).

**Mood anahtar kelimeleri:** sakin, sıcak, sessiz özgüven, geniş nefes alan boşluk, editoryal.
**Referans hissi:** iyi bir mimarlık ofisi sitesi + sinematik bir kamp fotoğrafı. Teknoloji portfolyosu klişesi (neon, matrix, terminal) yok.

**Tasarım ilkeleri**
1. **Sade yüzey, güçlü tek aksan.** Sayfa nötr; tek canlı unsur ateş ve onun turuncusu.
2. **Işık hikâye anlatır.** Renk sıcaklığı ve parlaklık ilerlemeye bağlıdır; sabit dekor yoktur.
3. **Tipografi ana görsel.** Büyük, rahat, bol boşluklu başlıklar; görsel gürültü yok.
4. **Hareket anlamlıdır.** Her animasyon ya bir şeyi açıklar ya ateşle ilişkilidir.
5. **Yumuşak, modern, düz.** Pixel, scanline, monospace-her-yerde, CRT, 8-bit yok. Köşeler yumuşak, gölgeler ışık gibi (siyah değil sıcak).

**Düzen fikri:** Ateş sol altta sabit (`position: fixed`), içerik sağa doğru hafif ağırlıklı akar; masaüstünde sol 0–22% alan ateşin "ışık havuzu"dur, içerik 6/12 kolondan başlar.

---

## 2. Renk Token'ları

Tema: `<html data-theme="dark|light">`. Varsayılan: `prefers-color-scheme`, kullanıcı seçimi `localStorage`.

### 2.1 Koyu tema – "Gece kampı"

| Token | Hex | Kullanım |
|---|---|---|
| `--bg` | `#0E0C0B` | Sayfa zemini (sıcak siyah, saf siyah değil) |
| `--bg-warm` | `#1A110C` | Ateş yükseldikçe zemine karışan sıcak ton (bkz. §5) |
| `--surface` | `#161211` | Kart zemini |
| `--surface-2` | `#1F1917` | Yükseltilmiş kart/hover |
| `--border` | `#2C2420` | 1px çizgiler |
| `--border-strong` | `#453831` | Odak dışı vurgulu çizgi |
| `--text` | `#F3EDE7` | Ana metin (kontrast bg üzerinde 16:1) |
| `--text-muted` | `#A89C93` | İkincil metin (7.4:1) |
| `--text-faint` | `#6F645D` | Yardımcı etiket (3.6:1, sadece ≥18px/dekoratif) |
| `--accent` | `#FF7A2F` | Link, vurgu, imleç çekirdeği |
| `--accent-hot` | `#FFB347` | Hover/aktif, alev ortası |
| `--accent-soft` | `rgba(255,122,47,.12)` | Chip/seçili arka plan |
| `--on-accent` | `#1A0E06` | Accent zemin üstü metin |
| `--focus` | `#FFD08A` | Focus ring (2px + 3px offset) |
| `--success` | `#7BC47F` | Form başarı |
| `--danger` | `#F0675A` | Form hata |

### 2.2 Açık tema – "Akşamüstü kamp"

Gün batımına yakın sıcak krem; saf beyaz yok.

| Token | Hex | Kullanım |
|---|---|---|
| `--bg` | `#FAF5EE` | Sayfa zemini (krem) |
| `--bg-warm` | `#F6E3CC` | Ateş yükseldikçe zemin altın saat tonuna döner |
| `--surface` | `#FFFFFF` ‑ %60 → `#FFFCF8` | Kart zemini |
| `--surface-2` | `#F2EADF` | Hover |
| `--border` | `#E6DBCD` | Çizgiler |
| `--border-strong` | `#CDBBA6` | |
| `--text` | `#221915` | Ana metin (15:1) |
| `--text-muted` | `#6B5C52` | İkincil (5.9:1) |
| `--text-faint` | `#9A8A7E` | Dekoratif |
| `--accent` | `#D4521A` | Link/vurgu (bg üzerinde 4.6:1, AA) |
| `--accent-hot` | `#F08A2C` | Hover, alev |
| `--accent-soft` | `rgba(212,82,26,.10)` | |
| `--on-accent` | `#FFF8F0` | |
| `--focus` | `#B23F0D` | |
| `--success` | `#2F7D4A` | |
| `--danger` | `#C23B2E` | |

### 2.3 Ateşin renk sıcaklığı (iki tema ortak palet, ışık katmanları temaya göre karışır)

| Token | Hex | Kelvin hissi | Rol |
|---|---|---|---|
| `--fire-ember` | `#8A2A0E` | ~1200K | Kor, taban, kenar |
| `--fire-deep` | `#D13F12` | ~1500K | Alev dış kenarı |
| `--fire-core` | `#FF7A2F` | ~1800K | Alev gövdesi |
| `--fire-mid` | `#FFB347` | ~2200K | Alev ortası |
| `--fire-hot` | `#FFE2A0` | ~2800K | Çekirdek, kıvılcım başı |
| `--fire-white` | `#FFF6DC` | ~3500K | Coşkulu aşamada en sıcak nokta |
| `--smoke` | `#3A2F2A` @ 0–25% | – | Duman (sadece koyu temada görünür) |

Işık (glow) rengi: `rgba(255,140,50, a)`; ilerleme arttıkça `a` artar ve renk `#FF7A2F → #FFB347` yönüne kayar.

### 2.4 Açık temada ateş nasıl okunur
Beyaz zeminde ışık "eklemeli" çalışmaz, bu yüzden:
- Glow `mix-blend-mode: soft-light` yerine **`multiply` + `screen` karışımı yerine** düz `radial-gradient` (alpha) ile zemini **altın saat tonuna doğru boyar**: `--bg` `#FAF5EE` → `--bg-warm` `#F6E3CC` (progress 1'de). Sonuç: öğleden akşam üstüne geçiş hissi.
- Alevin kendisi koyu temayla aynı palette, ama **kenarına 1px'lik `#8A2A0E` @ 25% yumuşak kontur** ve altına küçük, sıcak-kahve yer gölgesi (`rgba(120,50,15,.18)`) eklenir ki krem üstünde kaybolmasın.
- Vinyet açık temada "kenar kararması" değil, **kenarda sıcak kehribar sis** (`rgba(240,138,44,.10)`): aydınlık sahnede ısı = renk doygunluğu artışıdır, kararma değil.
- Kıvılcımlar açık temada `--fire-core` + hafif `--fire-deep` kenar; additive yerine normal blend, boyut %15 büyük, opaklık %85 tavan.
- Kor aşaması (progress 0) açık temada belirgin ama sakin: ateş "gündüz közü" gibi, çevreyi aydınlatmaz; ışık yarıçapı koyu temanın %50'si.

---

## 3. Tipografi

**Fontlar (Google Fonts, `display=swap`, Latin + Latin-Extended, Türkçe karakterler zorunlu: ğ ş ı İ ö ü ç):**
1. **Başlık / Display: "Fraunces"** (variable; `opsz` 9..144, `wght` 300..700, `SOFT` 0..100). Başlıklarda `opsz` auto, `SOFT` 50, `wght` 400–500. Sıcak, hafif editoryal serif; retro değil, modern.
2. **Gövde / UI: "Inter"** (variable, `wght` 400..700) – `font-feature-settings: "ss01","cv11"`; sayılar için `tabular-nums` sayaçlarda.

> Alternatif (Fraunces yük yaratırsa): "Instrument Serif" başlık. Mono yok; etiketler Inter uppercase + letter-spacing ile yapılır.

**Ölçü (fluid, `clamp`)**

| Token | Değer | Font | Ağırlık | Satır yüksekliği | Letter-spacing |
|---|---|---|---|---|---|
| `--fs-hero` | `clamp(3.25rem, 9vw + 1rem, 9rem)` | Fraunces | 400 | 0.95 | -0.035em |
| `--fs-h1` | `clamp(2.5rem, 5vw + 1rem, 5rem)` | Fraunces | 400 | 1.02 | -0.03em |
| `--fs-h2` | `clamp(1.875rem, 3vw + 1rem, 3.25rem)` | Fraunces | 450 | 1.1 | -0.02em |
| `--fs-h3` | `clamp(1.375rem, 1.2vw + 1rem, 1.75rem)` | Fraunces | 500 | 1.2 | -0.01em |
| `--fs-lead` | `clamp(1.125rem, 0.6vw + 1rem, 1.375rem)` | Inter | 400 | 1.55 | 0 |
| `--fs-body` | `1rem` (16px) | Inter | 400 | 1.65 | 0 |
| `--fs-small` | `0.875rem` | Inter | 400/500 | 1.5 | 0.005em |
| `--fs-label` | `0.75rem` | Inter | 600 | 1.3 | 0.12em, UPPERCASE |

Kurallar: gövde satır uzunluğu 60–68ch; başlıkta `text-wrap: balance`, paragrafta `pretty`. TR'de uppercase için `text-transform` kullanılırken `lang` attribute'u doğru olmalı (`i`→`İ`). Başlıklarda italik Fraunces tek bir vurgu kelimesi için (accent rengi değil, yalnızca italik + hafif renk geçişi).

---

## 4. Boşluk, Grid, Radius, Gölge

**Boşluk (4px baz):** `--s-1:4 · s-2:8 · s-3:12 · s-4:16 · s-5:24 · s-6:32 · s-7:48 · s-8:64 · s-9:96 · s-10:128 · s-11:192` (px). Bölüm dikey aralığı: `clamp(96px, 14vw, 192px)`.

**Grid:** 12 kolon, max içerik `1280px`, dış padding `clamp(20px, 5vw, 64px)`, gutter `24px` (mobil 16px). Breakpoint'ler: 640 / 960 / 1280 / 1680. Ateş alanı: ≥960px'te sol 22vw rezerve (içerik `grid-column: 4 / -1` varsayılan, geniş görseller `2 / -1`). <960px'te ateş küçülür (bkz. §5.7) ve içerik tam genişliktir.

**Radius:** `--r-sm:8px · r-md:14px · r-lg:24px · r-xl:36px · r-pill:999px`. Kartlar `r-lg`, butonlar `r-pill`, görsel kapakları `r-lg`.

**Gölge (sıcak, düşük opaklık):**
- Koyu: `--sh-1: 0 1px 0 rgba(255,235,220,.04) inset, 0 8px 24px -12px rgba(0,0,0,.6)`; `--sh-2: 0 24px 60px -24px rgba(0,0,0,.7)`; `--sh-glow: 0 0 0 1px rgba(255,122,47,.35), 0 12px 48px -12px rgba(255,122,47,.35)` (hover kart).
- Açık: `--sh-1: 0 1px 2px rgba(80,45,20,.06), 0 8px 24px -14px rgba(80,45,20,.18)`; `--sh-2: 0 28px 60px -28px rgba(80,45,20,.28)`; `--sh-glow: 0 0 0 1px rgba(212,82,26,.35), 0 14px 40px -16px rgba(212,82,26,.35)`.

**Kart ışık yansıması:** Kartların sol-alt kenarı ateşe doğru bakar; `box-shadow` yerine `background: radial-gradient(at 0% 100%, rgba(255,140,50, calc(var(--fire) * .10)), transparent 60%)` ile ateşe yakın kartlar daha sıcak görünür (`--fire` = scroll ilerlemesi 0..1, bkz. §5).

---

## 5. KAMP ATEŞİ – Detaylı Spec

### 5.1 Veri akışı
Tek bir sayısal kaynak: `progress` (0..1) = `scrollY / (docHeight - viewportHeight)`; çok sayfalı yapıda her sayfa kendi progress'ini hesaplar **ama ateş sayfalar arası kalıcıdır**: sayfa geçişinde en son seviyeden devam eder, yeni sayfanın başlangıcında `progress` hedefi `max(pageProgress, sessionFloor)` olur; `sessionFloor` = ziyaret edilen sayfa sayısına bağlı küçük taban (Home 0, Projects .15, About .25, Contact .5; Contact sayfası kısa olduğundan `target = .6 + .4*pageProgress`). Hedefe **lerp** ile gidilir: `smooth += (target - smooth) * 0.06` (her frame) → ateş ani sıçramaz, "büyümek" hissi verir. `--fire` CSS değişkeni `smooth`'u taşır (`document.documentElement.style.setProperty`, sadece değişim >0.002 ise).

### 5.2 Aşamalar

| # | Aralık | Ad | Alev yüksekliği (vh) | Alev genişliği | Glow yarıçapı | Glow opaklık | Kıvılcım/sn | Zemin ısınması | Vinyet |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 0.00–0.12 | **Kor** | 0 (alev yok, sadece titreyen kor yatağı 24px) | 90px | 120px | .18 | 0.3 (ara sıra tek kıvılcım) | `--bg` aynen | yok |
| 1 | 0.12–0.30 | **Küçük alev** | 9vh | 70px | 240px | .30 | 1.5 | %5 | .00 |
| 2 | 0.30–0.55 | **Orta** | 17vh | 120px | 420px | .45 | 4 | %20 | .08 |
| 3 | 0.55–0.78 | **Büyük** | 27vh | 190px | 640px | .60 | 9 | %45 | .16 |
| 4 | 0.78–0.92 | **Çok büyük** | 36vh | 250px | 860px | .75 | 16 | %70 | .24 |
| 5 | 0.92–1.00 | **Coşkulu** | 44vh (dalgalı, nefes alıp verir) | 300px | 1100px | .90 | 26 + patlama dalgaları | %100 | .32 |

Değerler aşamalar arası **smoothstep interpolasyonlu** sürekli fonksiyondur (çıta atlama yok); tablo anahtar noktalardır. Aşama sınırında küçük "çıtırtı" olayı: yeni aşamaya her ilk girişte 6–10 kıvılcımlık tek seferlik burst (400ms).

Aşama davranış notları:
- **0 Kor:** 3–5 küçük (6–12px) daire kor, `#8A2A0E→#D13F12` arasında 2.4s `ease-in-out` nefes (opaklık .5↔1). Alt kısımda 2 odun kütüğü silüeti (düz, soft, `#1B100B` / açık tema `#3A2417`). İnce duman izi (koyu temada).
- **1 Küçük alev:** Tek dil alev, hafif sağa-sola eğilir (±4°, 3.2s sinüs). Çekirdek `--fire-hot`.
- **2 Orta:** 3 dil, merkez en uzun; ışık zemin gri-kahve tonuna sıcak bir pembe-turuncu halka verir. Sol kenar boyunca yakındaki tipografi hafif ısınır (`--text` → hafif sıcak, %3).
- **3 Büyük:** 5 dil, çekirdek `--fire-white` lekesi görünür; ışık titreşimi (flicker) belirgin. Yakın kartlarda sıcak kenar ışığı.
- **4 Çok büyük:** Ateş sağa doğru 1 ek yan dil atar; vinyet köşeleri turuncu-kahve; kıvılcımlar viewport'un üst yarısına ulaşır.
- **5 Coşkulu:** Alev nefes alıp verir (2.2s büyüme-küçülme ±8%), her ~3.5sn'de bir "kabarma" (flare, 600ms ease-out, glow +%15). Kıvılcım yağmuru sayfanın ortasına kadar ulaşır. Kısa süreliğine (≤1.2sn) ekran hafif parlar (`--fire-white` @ 4% flaş) – yalnızca ilk girişte, flaş sayısı oturum başına 1.

### 5.3 Katmanlar (alttan üste, hepsi `position: fixed; pointer-events: none`)

| z | Katman | Teknik | Detay |
|---|---|---|---|
| 1 | **Zemin ısınması** | CSS `background` üzerinde `::before` | `linear-gradient(to top right, var(--bg-warm) 0%, transparent 70%)`, `opacity: calc(var(--fire) * 1)`; sol-alt köşeden yükselen sıcak ton. |
| 2 | **Işık havuzu (glow)** | CSS `radial-gradient`, tek `div` | Merkez: ateşin tabanı (`left: 6vw; bottom: 4vh`). `radial-gradient(circle at 0 100%, rgba(255,140,50,.9) 0, rgba(255,110,40,.35) 30%, transparent 70%)`. Boyut ve opaklık §5.2'den. Yalnızca `transform: scale()` + `opacity` değişir (compositor). Flicker: 3 katmanlı sinüs toplamı (5.1Hz, 8.3Hz, 13Hz, genlik %3–6), JS'ten tek `opacity` yazımı. |
| 3 | **Yansıma (rim light)** | CSS değişkeni | `--fire` değerini kartlar/başlıklar okur (§4). Ek JS yok. |
| 4 | **Alev gövdesi** | **Canvas 2D** (DPR sınırlı 1.5) | Alev "metaball" benzeri yumuşak katmanlı damlalar: her dil 3 üst üste bezier gövde (dış `--fire-deep`, orta `--fire-core`, iç `--fire-mid`, çekirdek `--fire-hot`) `globalCompositeOperation: 'lighter'` (koyu), `'source-over'` (açık). Titreşim: simplex-benzeri 1D noise (zamanla), uç noktalar noise ile kayar. Canvas boyutu: ateş kutusu + pay (ör. 360×60vh max), **tam ekran değil**. |
| 5 | **Odun / taşlar** | Inline **SVG** (statik) | Düz geometrik 3 kütük + 5 taş, flat, `r` yumuşak. Alevin altında, canvas'ın üstünde (z: 5) küçük ön kütük alevin tabanını örter. |
| 6 | **Kıvılcım parçacıkları** | Aynı **canvas** (veya ayrı geniş canvas, 0.5x çözünürlük) | Bkz. §5.4. |
| 7 | **Duman** | Canvas içinde 6–10 büyük, çok düşük opaklıklı blur sprite (önceden render edilmiş offscreen canvas) | Sadece koyu tema; açık temada kapalı. |
| 8 | **Kenar vinyeti** | CSS `radial-gradient` overlay | Koyu: `radial-gradient(ellipse at 0% 100%, transparent 40%, rgba(40,15,5,var(--vig)) 100%)`; açık: kehribar sis (§2.4). `--vig` §5.2 tablosundan. Sağ üst köşe hafifçe ısınır (%30 etki) → "ışık odayı sarıyor". |

### 5.4 Kıvılcım parçacık sistemi
- Havuz: sabit 120 parçacık (nesne havuzu, GC yok). Aktif sayısı §5.2 hızına göre.
- Doğum: alev tabanının üst yarısından, `x ± genişlik*0.35`.
- Hız: `vy = -(60..160) px/s * (0.7 + .6*fire)`, `vx = (-20..40) px/s` (rüzgar hafif sağa), sönüm `0.985/frame`, wobble `sin(t*3 + seed)*12px/s`.
- Ömür: 0.9–2.6 sn (fire arttıkça uzar). Boyut 1.5–4px (fire arttıkça 5px'e kadar). Renk ömür boyunca `--fire-white → --fire-mid → --fire-deep → şeffaf`. Kuyruk: önceki konumdan 1 çizgi (`lineWidth = size*.6`), glow için `shadowBlur` KULLANMA (pahalı); bunun yerine önceden çizilmiş 16×16 radyal sprite'ı `drawImage` ile bas.
- Bazı kıvılcımlar (%8) yukarıda "yıldız"a dönüşür: 2.6sn'den sonra yavaşça kaybolur, çok yavaş sürünür.
- Kıvılcımlar mouse imleciyle etkileşir: imlece 140px yakınsa hafif itilir (§6.6).

### 5.5 Performans yaklaşımı
- **Tek `requestAnimationFrame` döngüsü**; scroll olayı yalnızca `target`'ı günceller (passive listener). Tüm çizim rAF'ta.
- Alev + kıvılcım için **tek küçük canvas** (ateş kutusu ≈ `min(520px, 40vw) × 70vh`), tam ekran canvas yok. Kıvılcım yüksek uçuşları için ikinci canvas (tam yükseklik, ateş sütunu genişliği + 25vw, `scale 0.5`).
- Statik/yavaş katmanlar (glow, vinyet, zemin ısınması) **CSS** + `will-change: opacity, transform` yalnızca ateş katmanlarında; `transform`/`opacity` dışında özellik animasyonu yok (layout/paint tetiklemez).
- Kare bütçesi: ≤ 3 ms/frame JS. Hedef 60fps; ölçülen frame >20ms 30 kare üst üste olursa **kalite düşürme**: parçacık havuzu %50, DPR 1, duman kapat, flicker kapat (kademeli).
- `IntersectionObserver` gerekmez (fixed), fakat sekme gizliyse (`visibilitychange`) döngü durur.
- Mobil (<960px): ateş küçük (alev yüksekliği ×0.6, glow ×0.6), parçacık havuzu 50, DPR 1.
- SVG yalnızca statik varlıklar (odun/taş, ikon); animasyonlu SVG filter (feTurbulence/feGaussianBlur) YASAK.
- Renk interpolasyonu için LUT (256 giriş) önceden hesaplanır.
- Tema değişiminde canvas yeniden oluşturulmaz; yalnızca blend modu ve palet LUT'u değişir.

### 5.6 `prefers-reduced-motion: reduce`
- Canvas animasyonu ve kıvılcımlar **kapalı**; yerine **statik ateş illüstrasyonu** (SVG) gösterilir. Aşama değişimi: 5 hazır SVG/PNG karesi arasında 400ms `opacity` cross-fade (scroll'a göre değişir, titreşim yok).
- Glow/vinyet/zemin ısınması çalışır ama lerp yerine anlık ve yalnızca opaklık geçişi (300ms).
- Parallax, yatay kayan bölüm, sayaç animasyonu, magnet efektleri kapalı (sayaçlar doğrudan son değeri gösterir; yatay bölüm dikey liste olur).
- Özel imleç bu modda **sade** (kıvılcım izi yok, sadece halka-nokta).
- Kullanıcıya görünür bir "Hareketi azalt/aç" toggle (footer) sunulur; kararı `localStorage` tutar.

### 5.7 Erişilebilirlik ve diğer
- Ateş `aria-hidden="true"`; içerik okunabilirliği: ateş içerik üstüne binmez (sol rezerve alan) ve glow ile metin arasındaki kontrast asla <4.5:1'e düşmez (glow metin katmanının altındadır, opaklık tavanı metin üzerinde .35).
- Yazdırma: ateş gizlenir.
- Mobilde ateş sol altta ama küçük; alt navigasyon yok, çakışma olmaz.

---

## 6. Mouse İmleci

Yalnızca `(hover: hover) and (pointer: fine)`. Dokunmatikte tamamen kapalı, sistem imleci kullanılır. Sistem imleci `cursor: none` yalnızca JS yüklendikten sonra eklenir (`.has-custom-cursor`); JS başarısız olursa varsayılan imleç kalır.

### 6.1 Yapı
İki eleman (`position: fixed; top:0; left:0; pointer-events:none; mix-blend-mode: normal; z-index: 9999`):
- **Çekirdek (ember dot):** 8px daire, `--fire-hot` merkez → `--accent` kenar radial gradient, anlık takip (`translate3d`, gecikme yok).
- **Halo (ışık halkası):** 36px daire, 1.5px `--accent` @ 55% çerçeve + içte `radial-gradient(rgba(255,140,50,.18), transparent 70%)`; lerp ile takip `0.18` (yumuşak gecikme ≈ 90ms).
- **Kıvılcım izi:** hareket hızına bağlı; küçük 2–3px parçacıklar çekirdek konumundan doğar (hız > 4px/frame ise 1 parçacık/16ms, max 24 aktif), ömür 500–800ms, yukarı sürüklenir (`vy -20..-50px/s`), rengi `--fire-hot → --fire-deep → şeffaf`. Küçük ayrı canvas (tam ekran, DPR 1) üzerinde çizilir. Durunca iz biter, sadece nadiren (her 700ms) tek kıvılcım "çıtırtı".

### 6.2 Durumlar

| Durum | Çekirdek | Halo | Süre/easing |
|---|---|---|---|
| **Default** | 8px, `--fire-hot` | 36px, ince çerçeve | – |
| **Link hover** (`a`, `[data-cursor="link"]`) | 6px'e küçülür | 64px'e büyür, dolgu `--accent-soft`, çerçeve kalkar; kıvılcım izi yoğunluğu ×2; link metni altı çizgisi soldan sağa dolar (§8) | 280ms `cubic-bezier(.2,.8,.2,1)` |
| **Buton / CTA** (`button`, `.btn`) | Gizlenir (scale 0) | 72px, dolgu `--accent` @ 90%, içinde `--on-accent` ok/ikon "→" veya buton etiketi (data-cursor-label); buton hafif manyetik (§8) | 320ms `cubic-bezier(.34,1.56,.64,1)` |
| **Metin** (`p, h1-h3, input[type=text], textarea`) | Dikey 2×22px "ışık çubuğu" (i-beam), `--accent` | Halo 24px'e küçülür, opaklık .5 | 180ms ease-out |
| **Proje kartı** (`[data-cursor="view"]`) | Gizli | 96px dolu `--accent`, ortada "Gör"/"View" (Inter 600 12px uppercase) | 360ms spring |
| **Sürükle** (yatay galeri) | – | 80px, ortada "← →" | 240ms |
| **Tıklama (mousedown)** | scale .6 | scale .85 + dışa yayılan halka dalgası (tek: 36→120px, opaklık .5→0, 520ms ease-out) + 8–12 kıvılcım burst (radyal, 300–500ms) | 120ms in, 520ms out |
| **Devre dışı / seçim** | – | `not-allowed` için halo kırmızımsı (`--danger` @ 40%) | 200ms |
| **Pencere dışı** | opacity 0 | opacity 0 | 200ms |

### 6.3 Kıvılcım izi ve ateş etkileşimi
- İmleç sol alt ateş alanına yaklaştıkça (mesafe <220px) halo ısınır (`--accent-hot` karışımı) ve ateşin flicker genliği +%20 olur ("ateşe elini uzatmak").
- Ateş kıvılcımları imlece 140px yakınsa hafifçe itilir (`force = (1 - d/140) * 40px/s`).

### 6.4 Teknik
- Çekirdek/halo konumu `transform: translate3d`; kıvılcım canvas ayrı rAF (ana ateş döngüsüyle paylaşabilir).
- `pointermove` passive; durum tespiti `pointerover` delegasyonu ile (`closest('[data-cursor], a, button, input, textarea')`).
- Odak klavye ile çalışırken özel imleç gizlenir (`:focus-visible` kullanımı sırasında `keydown` Tab → imleç opacity 0).
- Reduced-motion: kıvılcım izi yok, halo lerp yok (anında).
- Blend modları: koyu temada halo `screen`, açık temada `normal`.

---

## 7. Scroll Animasyon Kataloğu

Ortak kural: tüm reveal'lar `IntersectionObserver` (threshold 0.15, rootMargin `0px 0px -10% 0px`) ile bir kez tetiklenir; scrub tabanlı olanlar rAF'ta `transform` yazar. Varsayılan easing `--ease-out: cubic-bezier(.16,1,.3,1)`, süre 800–1000ms. Stagger 70ms. Kütüphane önerisi (isteğe bağlı): GSAP + ScrollTrigger veya vanilla; her ikisi de bu spec'i karşılar.

### Ortak (global)
- **Ateş progress:** §5. Üstte 2px ince "ilerleme çizgisi" YOK (ateş zaten gösterge).
- **Nav:** scroll aşağı → gizlenir (`translateY(-100%)`, 400ms), yukarı → geri gelir; scrollY>40 ise arka plan `backdrop-filter: blur(14px)` + `--bg` @ 70%.
- **Başlık satır reveal:** başlıklar satırlara bölünür (`overflow:hidden` maske), her satır `translateY(110%) → 0`, 900ms `--ease-out`, stagger 90ms.

### Home
1. **Hero:** Büyük isim satır-satır reveal (yukarıdaki); alt metin 300ms gecikmeyle fade+8px. Scroll'la hero başlığı **parallax** (`translateY: 0 → -12vh`, `opacity 1 → 0` scrub), içindeki italik vurgu kelimesi ateş yönünde hafif kayar (+2vw).
2. **Giriş/manifesto paragrafı:** Kelime kelime **scrubbed opacity** (.18 → 1), kelimeler scroll'la sırayla yanar (ateşin "ısıttığı" hissi); renk `--text-faint → --text`.
3. **Seçili projeler (yatay kayan bölüm):** Section `pin`; dikey scroll yatay kaydırmaya dönüşür (`translateX` 0 → -(trackWidth - 100vw)), kartlar 480×600px, aralarında 32px; aktif kart ölçeği 1.0, komşular .94 ve `opacity .6` (scrub). Üstte büyük sayı sayacı "01 / 05" (tabular-nums, yuvarlak geçiş). Mobilde pin yok, native `scroll-snap-type: x mandatory`.
4. **Sayaç şeridi:** (proje sayısı, teknoloji, yıl, kahve) 0 → hedef, 1600ms `easeOutExpo`, görünür olunca bir kez; sayıların altında ince çizgi soldan sağa çizilir (700ms).

### Projects
5. **Filtre + liste:** Filtre chip'leri değişince kartlar **FLIP** ile yeniden dizilir (450ms `cubic-bezier(.65,0,.35,1)`), çıkanlar `scale .96 + opacity 0`.
6. **Kart reveal:** Görsel `clip-path: inset(100% 0 0 0) → inset(0)` (1000ms `cubic-bezier(.77,0,.18,1)`), içindeki görsel `scale 1.15 → 1` (scrub parallax içte -8%/+8%).
7. **Proje detay:** Kapak görseli tam genişliğe **genişler** (scroll'la `border-radius 36px→0`, genişlik 80%→100%); sticky yan sütunda proje meta bilgisi (rol, yıl, stack), sağda içerik blokları sırayla reveal; sonunda "Sonraki proje" devasa başlık hover'da dolgu rengi soldan dolar.

### About
8. **Portre + metin:** Portre `clip-path: circle(0% at 50% 50%) → circle(75%)` (1100ms). Yan metin paragrafları 60ms stagger fade-up.
9. **Zaman çizelgesi (deneyim/eğitim):** Dikey çizgi scroll'la **çizilir** (`scaleY` scrub, `transform-origin: top`), her düğüm çizgi noktaya ulaşınca sönük→`--accent` dolu (nokta çevresine kısa glow, 400ms). Düğüm kartları dönüşümlü sağdan/soldan 40px kayarak girer.
10. **Yetenekler marquee:** İki satır zıt yönlü sonsuz kayan şerit (`--fs-h2`, aralarında küçük kıvılcım ayracı "✦" yerine 6px daire); hız scroll hızıyla ölçeklenir (baz 40px/s, scroll hızı × 0.15 eklenir, 300ms yumuşatma); hover'da yavaşlar (×0.2).

### Contact
11. **Devasa CTA:** "Birlikte bir şey yapalım" başlığı `--fs-hero`, scroll'la harf aralığı `-0.035em → 0` ve ateş seviyesi max'a yaklaşırken başlığa alt kenardan sıcak ışık gradyanı oturur (`background-clip: text`, gradient konumu progress'e bağlı).
12. **Form:** Alanlar sırayla reveal; odaklanınca etiket yukarı süzülür (200ms) ve alt çizgi soldan dolar (`--accent`, 300ms). Gönder başarısında buton "✓" olur ve ateşte 1 kez flare tetiklenir (600ms).

### Footer (ortak)
13. Footer büyük "İyi geceler / Good night" metni; ateş en yüksekteyken metin **sıcak parlama**; yukarı dönüş butonu: tıklayınca scroll 1200ms `cubic-bezier(.65,0,.35,1)` ile başa; ateş geri küçülür (lerp'in hızı geçici 0.12'ye çıkar, "sönüyor" hissi).

---

## 8. Mikro Etkileşimler ve Geçişler

**Butonlar:** Pill, padding 14×26, `--fs-small` 600. Primary: dolgu `--accent`, hover'da `--accent-hot` + `translateY(-2px)` + `--sh-glow`, 240ms `--ease-out`. İçinde ok ikonu hover'da 6px sağa kayar. **Manyetik:** imleç 80px yaklaşınca buton `translate(dx*.25, dy*.25)`, ayrılınca 500ms `cubic-bezier(.34,1.56,.64,1)` ile yerine döner. Basılı: `scale .97` 90ms.

**Linkler:** Altı çizgi `background-size: 0% 1px → 100% 1px`, 350ms `cubic-bezier(.65,0,.35,1)`; çıkışta sağdan söner (origin değişir).

**Kartlar:** Hover: görsel `scale 1.04` (600ms), kart `translateY(-6px)`, `--sh-glow`, başlıktaki ok sağ-üste 8px kayar, ateş tarafındaki kenarda sıcak ışık yoğunlaşır. Dokunmatikte `:active` ile `scale .985`.

**Nav linkleri:** Aktif sayfa altında 4px nokta (`--accent`); sayfa değişince nokta yeni linke kayar (layout animasyonu, 450ms `cubic-bezier(.65,0,.35,1)`).

**Fokus:** `outline: 2px solid var(--focus); outline-offset: 3px; border-radius: inherit`, geçiş 120ms. Tüm interaktifler klavye ile erişilebilir.

**Sayfa geçişi:** Çıkış: içerik `opacity→0 + translateY(-12px)` 280ms ease-in; ateş **kalıcıdır** (aynı DOM'da kalır, SPA/View Transitions API; fallback: sayfa yenilemede progress `sessionStorage`'dan okunup 0.6s içinde hedefe lerp). Giriş: 500ms `--ease-out` başlık satır reveal. Üstte ince sıcak ışık süpürmesi (gradyan 120% genişlik, soldan sağa, 600ms, opacity .12).

### 8.1 Tema geçişi (koyu ↔ açık)
Toggle: nav'da 40px yuvarlak buton; ikon güneş/ay yerine **alev ↔ ay-hilal** morph (SVG path morph, 450ms). Tüm sayfa geçişi **ateşten yayılan dairesel clip-path reveal** (View Transitions API): yeni tema, ateşin tabanından (`0% 100%`) `clip-path: circle(0 at 6vw 96vh) → circle(150vmax at 6vw 96vh)`, 900ms `cubic-bezier(.65,0,.35,1)`. Fallback (API yok): 400ms renk cross-fade (`transition: background-color, color, border-color 400ms`). Ateş canvas'ı geçiş sırasında kesilmez; blend/palet LUT'u geçişin ortasında (450ms) değişir. Reduced-motion: 200ms basit fade.

### 8.2 Dil geçişi (TR ↔ EN)
Toggle: "TR / EN" segmentli kontrol, aktif seçeneği altında kayan pill (300ms spring). İçerik değişimi: metin düğümleri satır bazında **dikey kayma**; eski metin `translateY(-40%) + opacity 0` (220ms ease-in), yeni metin `translateY(40%)→0` (380ms `--ease-out`), stagger 25ms. Layout sıçramasını önlemek için: değişimden önce konteyner yüksekliği ölçülüp 300ms'de yeni yüksekliğe geçilir. `html[lang]` anında güncellenir, tercih `localStorage`, ilk açılış `navigator.language`. Reduced-motion: 150ms cross-fade.

### 8.3 Diğer
- **Yükleme (preloader):** Yok (sade). Sadece hero reveal. Ateş kor aşamasında 800ms "tutuşma" animasyonuyla (opacity 0→1, bir kıvılcım) başlar.
- **Kopyala (e-posta):** Tıklayınca metin "Kopyalandı ✓" olur 1600ms, imleçte kıvılcım burst.
- **Scroll-to-top / `Konami`:** Yok. Easter egg: ateşe tıklanınca (fixed olduğu için ateş alanı `pointer-events:auto` küçük hit alan) bir "odun at" kıvılcım patlaması – kozmetik, 1sn.
- **Skeleton/gecikme:** Görseller `blur(12px)→0` + `opacity` 500ms, LQIP arka plan renkli.

---

## 9. YAPILMAMASI GEREKENLER

1. Pixel-art, 8-bit font, CRT/scanline, terminal komut satırı teması, yeşil-siyah "hacker" estetiği, typewriter efekti.
2. Neon, mor-mavi gradient, glassmorphism aşırısı, "AI/web3" parlak mesh gradient arka plan.
3. Saf `#000` ve saf `#FFF` zemin; saf siyah gölge (koyu temada zorunlu hariç).
4. Üçten fazla aksan rengi. Aksan yalnızca ateş paletidir.
5. Scroll-jacking: scroll hızını/yönünü değiştirme (yalnızca pin'li yatay bölümde, kısa ve net, mobilde yok); sayfayı "snap"e zorlamak.
6. Ateşin içeriğin üstüne binmesi veya metin kontrastını düşürmesi; ateş z-index'in içerik altında olması.
7. Tam ekran yüksek DPR canvas, `shadowBlur`, animasyonlu SVG filter, `box-shadow`/`width`/`top` animasyonu, layout thrash.
8. Parçacık sayısını sınırsız bırakmak; her frame'de nesne üretmek (GC).
9. 600ms'den uzun etkileşim gecikmesi gerektiren hover efektleri; 1.2sn'yi aşan reveal'lar (hero hariç).
10. Aynı anda 3'ten fazla farklı hareket tipi aynı görünümde; her şeyin aynı anda animasyonu.
11. Özel imleci dokunmatikte açmak, klavye kullanıcısında göstermek, imleç gecikmesini >120ms yapmak, link olmayan yerde "tıklanabilir" imleç göstermek.
12. `prefers-reduced-motion`'ı yok saymak; sadece animasyonla iletilen bilgi (ör. dil/tema durumu) bırakmak.
13. Çok sayıda font ağırlığı yüklemek (maks. Fraunces 2 eksen + Inter variable); ikon font kütüphanesi eklemek.
14. Lorem ipsum veya stok görsel; gerçek proje görselleri/mockup kullanılacak.
15. Ses: otomatik oynayan hiçbir ses/müzik (ateş çıtırtısı varsa yalnızca kullanıcı açarsa, varsayılan kapalı).
16. Tema/dil çevirilerini yalnızca görselde yapmak: `lang`, `meta`, `title` de güncellenmeli.
17. Parallax'ı mobilde ağır uygulamak (mobilde ≤%50 mesafe, scrubbed efektler basitleştirilir).

---

## 10. Hızlı Referans (CSS değişkenleri ve sabitler)

```
--ease-out:    cubic-bezier(.16,1,.3,1);
--ease-in-out: cubic-bezier(.65,0,.35,1);
--ease-spring: cubic-bezier(.34,1.56,.64,1);
--ease-clip:   cubic-bezier(.77,0,.18,1);
--dur-fast: 150ms; --dur-base: 280ms; --dur-slow: 600ms; --dur-reveal: 900ms;
--fire: 0..1 (lerp 0.06/frame)   --vig: 0..0.32
```

Dosya yapısı önerisi (bilgi): `index.html, projects.html, project-detail.html, about.html, contact.html`, ortak `css/tokens.css`, `js/fire.js`, `js/cursor.js`, `js/scroll.js`, `js/i18n.js`, `js/theme.js`.
