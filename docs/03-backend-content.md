# 03 - Backend ve İçerik Mimarisi

Ortam: Node v24.20.0, npm 12.0.2 (kontrol edildi). Windows. Proje: iki dilli (tr/en) kişisel portfolyo, üniversite vize projesi.

Temel ilke: **Önce statik/veri odaklı frontend, admin sonra.** Bu yüzden içerik şeması ve bir "veri katmanı" soyutlaması şimdiden sabitlenir; admin gelince yalnızca veri kaynağı (JSON import -> fetch) değişir, bileşenlere dokunulmaz.

---

## 1. Teknoloji yığını ve gerekçe

| Katman | Seçim | Gerekçe |
|---|---|---|
| Frontend | Vite + React + TypeScript | Hızlı dev server, statik build, tip güvenliği; şema tipleri frontend ile backend arasında paylaşılabilir. |
| Backend | **Express 5 + TypeScript (tsx ile çalıştırma)** | En yaygın, en çok dokümante edilen seçenek; ödev için sunumda anlatması kolay. Fastify daha hızlı ama bu ölçekte fark yok. |
| Depolama | **JSON dosyası (`server/data/*.json`) + repository arayüzü** | Kurulum yok, native derleme yok (better-sqlite3 Windows'ta bazen sorun çıkarır), veri git'te görünür ve yedeklenir, frontend'in kullanacağı JSON ile birebir aynı biçim. İleride SQLite'a geçmek gerekirse yalnızca repository dosyası değişir. |
| Auth | JWT (kısa ömürlü, httpOnly cookie) + bcrypt/argon2 | Tek admin kullanıcısı için yeterli; oturum tablosu gerekmez. |
| Doğrulama | Zod | Aynı şema hem istek doğrulama hem TS tipi üretir (`z.infer`). |

Karar: **Express + JSON dosya deposu + JWT admin.** Tek kullanıcılı, düşük yazma trafikli bir portfolyo için veritabanı gereksiz karmaşıklıktır. Yazma işlemleri "geçici dosyaya yaz, sonra rename" ile atomik yapılır ve tek süreçte bir mutex ile sıralanır.

Not: Vize teslimi için statik faz (Faz 1) tek başına yeterli çalışır; backend Faz 2'dir.

### Fazlar
- **Faz 1 (şimdi):** `src/content/*.json` + `ContentProvider` (statik). Backend yok. GitHub verisi tarayıcıdan.
- **Faz 2:** `/server` (Express) içerik API'si + admin CRUD + auth. Frontend `HttpContentSource`'a geçer.
- **Faz 3 (opsiyonel):** GitHub proxy+cache, iletişim formu endpoint'i.

---

## 2. İçerik şeması (Faz 1: frontend şimdi tüketir)

### 2.1 Tip tanımları (`web/src/content/types.ts`)

```ts
export type Lang = 'tr' | 'en';

/** Her metin alanı iki dilli. Boş bırakılabilir ama anahtarlar daima bulunur. */
export interface LocalizedText {
  tr: string;
  en: string;
}

export type ID = string; // slug veya uuid, örn. "portfolio-site"

/** Tüm koleksiyon öğeleri için ortak alanlar */
interface BaseItem {
  id: ID;
  order: number;        // listede sıralama (küçük olan önce)
  visible: boolean;     // admin "gizle" yapabilsin
  updatedAt?: string;   // ISO 8601, API fazında sunucu doldurur
}

export interface Profile {
  name: string;                    // dile bağlı değil
  title: LocalizedText;            // "Yazılım Geliştirici" / "Software Developer"
  tagline: LocalizedText;          // hero alt metni
  bio: LocalizedText;              // hakkımda (düz metin; paragraf için \n\n)
  location: LocalizedText;
  email: string;
  avatarUrl: string;               // /images/avatar.jpg
  resumeUrl: LocalizedText;        // CV PDF linki, dile göre ayrı dosya
  githubUsername: string;          // GitHub entegrasyonu buradan okur
  seo: {
    title: LocalizedText;
    description: LocalizedText;
  };
}

export type SocialPlatform =
  | 'github' | 'linkedin' | 'twitter' | 'instagram'
  | 'youtube' | 'medium' | 'email' | 'website' | 'other';

export interface SocialLink extends BaseItem {
  platform: SocialPlatform;
  label: LocalizedText;            // erişilebilirlik ve görünen ad
  url: string;                     // https://... veya mailto:
  icon?: string;                   // platform'dan türetilir, override opsiyonel
}

export interface Project extends BaseItem {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;          // kart özeti (1-2 cümle)
  description: LocalizedText;      // detay sayfası
  tags: string[];                  // teknolojiler, dile bağlı değil: ["React","TypeScript"]
  coverImage: string;
  images?: string[];
  repoUrl?: string;
  liveUrl?: string;
  githubRepo?: string;             // "kullanici/repo"; verilirse yıldız sayısı vb. çekilebilir
  featured: boolean;
  startDate?: string;              // "2025-03"
  endDate?: string | null;         // null = devam ediyor
}

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export interface Skill extends BaseItem {
  name: string;                    // "TypeScript" (dile bağlı değil)
  category: 'frontend' | 'backend' | 'database' | 'tools' | 'languages' | 'other';
  level?: SkillLevel;
  icon?: string;
}

export interface Experience extends BaseItem {
  kind: 'work' | 'education' | 'volunteer';
  organization: LocalizedText;
  role: LocalizedText;
  description: LocalizedText;
  location?: LocalizedText;
  startDate: string;               // "2024-09"
  endDate: string | null;          // null = halen
  url?: string;
}

/** Arayüz etiketleri (menü, buton vb.) - admin bunları da yönetebilsin diye veri */
export type UiStrings = Record<string, LocalizedText>;

export interface SiteContent {
  profile: Profile;
  socials: SocialLink[];
  projects: Project[];
  skills: Skill[];
  experience: Experience[];
  ui: UiStrings;
}
```

Kurallar:
- Dile bağlı olmayan şeyler (isim, teknoloji adı, URL) `LocalizedText` yapılmaz.
- `en` boşsa görüntülemede `tr`'ye fallback yapılır (yardımcı: `t(text, lang)`).
- Tarihler `YYYY-MM` string; gösterimde `Intl.DateTimeFormat(lang)` ile biçimlenir.
- `id` değişmez; sıralama `order` ile yapılır (admin sürükle-bırak buna yazar).

### 2.2 Dosya düzeni
```
web/src/content/
  types.ts
  profile.json
  socials.json
  projects.json
  skills.json
  experience.json
  ui.json
```

### 2.3 Örnek JSON

`profile.json`
```json
{
  "name": "Name Hanay",
  "title": { "tr": "Yazılım Geliştirici", "en": "Software Developer" },
  "tagline": {
    "tr": "Web ve arka uç projeleri geliştiriyorum.",
    "en": "I build web and backend projects."
  },
  "bio": {
    "tr": "Bilgisayar mühendisliği öğrencisiyim. Temiz, sürdürülebilir kod yazmayı severim.",
    "en": "I am a computer engineering student who enjoys writing clean, maintainable code."
  },
  "location": { "tr": "Türkiye", "en": "Turkey" },
  "email": "name@example.com",
  "avatarUrl": "/images/avatar.jpg",
  "resumeUrl": { "tr": "/cv/cv-tr.pdf", "en": "/cv/cv-en.pdf" },
  "githubUsername": "GITHUB_KULLANICI_ADI",
  "seo": {
    "title": { "tr": "Name Hanay | Portfolyo", "en": "Name Hanay | Portfolio" },
    "description": {
      "tr": "Name Hanay'ın kişisel portfolyo sitesi.",
      "en": "Personal portfolio website of Name Hanay."
    }
  }
}
```

`socials.json`
```json
[
  {
    "id": "github", "order": 1, "visible": true,
    "platform": "github",
    "label": { "tr": "GitHub profilim", "en": "My GitHub profile" },
    "url": "https://github.com/GITHUB_KULLANICI_ADI"
  },
  {
    "id": "linkedin", "order": 2, "visible": true,
    "platform": "linkedin",
    "label": { "tr": "LinkedIn", "en": "LinkedIn" },
    "url": "https://www.linkedin.com/in/KULLANICI/"
  },
  {
    "id": "email", "order": 3, "visible": true,
    "platform": "email",
    "label": { "tr": "E-posta gönder", "en": "Send email" },
    "url": "mailto:name@example.com"
  }
]
```

`projects.json`
```json
[
  {
    "id": "portfolio-site", "slug": "portfolio-site", "order": 1,
    "visible": true, "featured": true,
    "title": { "tr": "Kişisel Portfolyo", "en": "Personal Portfolio" },
    "summary": {
      "tr": "İki dilli, React ile yazılmış portfolyo sitesi.",
      "en": "A bilingual portfolio site built with React."
    },
    "description": {
      "tr": "Vite, React ve TypeScript ile geliştirildi. İçerik JSON'dan okunur; admin paneli ile yönetilecek.",
      "en": "Built with Vite, React and TypeScript. Content is read from JSON and will be managed via an admin panel."
    },
    "tags": ["React", "TypeScript", "Vite"],
    "coverImage": "/images/projects/portfolio.png",
    "repoUrl": "https://github.com/GITHUB_KULLANICI_ADI/portfolio",
    "liveUrl": "https://example.vercel.app",
    "githubRepo": "GITHUB_KULLANICI_ADI/portfolio",
    "startDate": "2026-09",
    "endDate": null
  }
]
```

`skills.json`
```json
[
  { "id": "ts", "order": 1, "visible": true, "name": "TypeScript", "category": "languages", "level": 4 },
  { "id": "react", "order": 2, "visible": true, "name": "React", "category": "frontend", "level": 4 },
  { "id": "node", "order": 3, "visible": true, "name": "Node.js", "category": "backend", "level": 3 }
]
```

`experience.json`
```json
[
  {
    "id": "uni", "order": 1, "visible": true, "kind": "education",
    "organization": { "tr": "Üniversite Adı", "en": "University Name" },
    "role": { "tr": "Bilgisayar Mühendisliği (Lisans)", "en": "B.Sc. in Computer Engineering" },
    "description": { "tr": "Devam ediyor.", "en": "In progress." },
    "startDate": "2023-09",
    "endDate": null
  }
]
```

`ui.json` (kısaltılmış)
```json
{
  "nav.about":    { "tr": "Hakkımda",  "en": "About" },
  "nav.projects": { "tr": "Projeler",  "en": "Projects" },
  "nav.contact":  { "tr": "İletişim",  "en": "Contact" },
  "common.viewCode": { "tr": "Kodu gör", "en": "View code" },
  "common.liveDemo": { "tr": "Canlı demo", "en": "Live demo" }
}
```

---

## 3. API'ye geçiş: data layer soyutlaması

### 3.1 Prensip
Bileşenler hiçbir zaman `import projects from '../content/projects.json'` yapmaz. Yalnızca bir hook/context üzerinden okur. Kaynak, arayüz arkasında değiştirilir.

```ts
// web/src/data/ContentSource.ts
import type { SiteContent } from '../content/types';

export interface ContentSource {
  /** Tüm site içeriğini getirir (public, salt okunur) */
  getContent(signal?: AbortSignal): Promise<SiteContent>;
}
```

```ts
// web/src/data/StaticContentSource.ts  (Faz 1)
import profile from '../content/profile.json';
import socials from '../content/socials.json';
import projects from '../content/projects.json';
import skills from '../content/skills.json';
import experience from '../content/experience.json';
import ui from '../content/ui.json';
import type { ContentSource } from './ContentSource';
import type { SiteContent } from '../content/types';

export const staticContentSource: ContentSource = {
  async getContent() {
    return { profile, socials, projects, skills, experience, ui } as SiteContent;
  },
};
```

```ts
// web/src/data/HttpContentSource.ts  (Faz 2)
import type { ContentSource } from './ContentSource';

export const createHttpContentSource = (baseUrl: string): ContentSource => ({
  async getContent(signal) {
    const res = await fetch(`${baseUrl}/api/content`, { signal });
    if (!res.ok) throw new Error(`Content API ${res.status}`);
    return res.json();
  },
});
```

```ts
// web/src/data/index.ts - TEK değişiklik noktası
import { staticContentSource } from './StaticContentSource';
import { createHttpContentSource } from './HttpContentSource';

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
export const contentSource = apiUrl
  ? createHttpContentSource(apiUrl)
  : staticContentSource;
```

```tsx
// web/src/data/ContentProvider.tsx
// Context: { content, status: 'loading'|'ready'|'error', lang, setLang }
// Hook'lar: useContent(), useProjects(), useProfile(), useLang(), useT()
// - Açılışta contentSource.getContent() çağrılır
// - Hata olursa API modunda statik JSON'a fallback (çevrimdışı / backend uykudaysa site yine açılır)
// - lang: URL (/tr, /en) veya localStorage'dan; <html lang> güncellenir
```

Öneri: `fallback = staticContentSource` her zaman paketle birlikte gelir. Render'ın ücretsiz planı uyuyabildiği için bu önemlidir: ilk açılışta API 30-60 sn gecikirse kullanıcı yine içeriği görür.

Admin için ikinci arayüz (Faz 2):
```ts
export interface AdminContentApi {
  login(username: string, password: string): Promise<void>;
  logout(): Promise<void>;
  list<T>(collection: Collection): Promise<T[]>;
  create<T>(collection: Collection, item: Omit<T, 'id'>): Promise<T>;
  update<T>(collection: Collection, id: string, patch: Partial<T>): Promise<T>;
  remove(collection: Collection, id: string): Promise<void>;
  reorder(collection: Collection, ids: string[]): Promise<void>;
  updateProfile(patch: Partial<Profile>): Promise<Profile>;
}
```

### 3.2 REST uç noktaları

Public (auth yok, GET, cache edilebilir):

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/content` | Tüm `SiteContent` (yalnızca `visible: true`). Frontend'in asıl kullandığı. |
| GET | `/api/profile` | Profile |
| GET | `/api/socials` | SocialLink[] |
| GET | `/api/projects` | Project[] (`?featured=true`) |
| GET | `/api/projects/:slug` | Tek proje |
| GET | `/api/skills` | Skill[] |
| GET | `/api/experience` | Experience[] |
| GET | `/api/github/profile` | (Faz 3) GitHub proxy |
| GET | `/api/github/repos` | (Faz 3) GitHub proxy |
| POST | `/api/contact` | (Opsiyonel) iletişim formu |
| GET | `/api/health` | Sağlık kontrolü |

Auth:

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/api/auth/login` | `{username,password}` -> httpOnly cookie ile JWT |
| POST | `/api/auth/logout` | Cookie'yi siler |
| GET | `/api/auth/me` | Oturum kontrolü |

Admin (JWT zorunlu; `visible:false` kayıtlar da dahil):

| Metot | Yol | Açıklama |
|---|---|---|
| GET/PUT | `/api/admin/profile` | Profili oku / güncelle |
| GET/POST | `/api/admin/projects` | Listele / ekle |
| GET/PUT/DELETE | `/api/admin/projects/:id` | Tek kayıt |
| PUT | `/api/admin/projects/reorder` | `{ids:[...]}` |
| ... | `/api/admin/socials`, `/skills`, `/experience` | Aynı CRUD kalıbı |
| GET/PUT | `/api/admin/ui` | Arayüz çevirileri |
| POST | `/api/admin/upload` | Görsel yükleme (opsiyonel, boyut/MIME sınırlı) |

Genel kurallar:
- Girdi Zod ile doğrulanır; `LocalizedText` için `tr` ve `en` string, en fazla uzunluk sınırı.
- Hata biçimi: `{ "error": { "code": "VALIDATION", "message": "...", "fields": {...} } }`.
- Public GET yanıtlarına `Cache-Control: public, max-age=60` + `ETag`.
- Admin'de çeviri eksikliği uyarısı: `GET /api/admin/i18n/missing` (en boş olan alanları listeler).

### 3.3 Sunucu tarafı depolama arayüzü
```ts
interface Repository<T extends { id: string }> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}
```
`JsonFileRepository` ilk uygulama; ileride `SqliteRepository`. Başlangıç verisi olarak frontend'in `src/content/*.json` dosyaları `server/data/` altına kopyalanır (seed). Böylece geçişte içerik kaybı olmaz.

---

## 4. GitHub entegrasyonu

### 4.1 Kullanılacak uç noktalar (public, token'sız çalışır)
- Profil: `GET https://api.github.com/users/{username}` (avatar, bio, public_repos, followers)
- Repolar: `GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated&type=owner`
- Diller (opsiyonel): `GET /repos/{owner}/{repo}/languages` (her repo için ek istek; yalnızca seçili projeler için)

Filtre: `fork === false`, `archived === false`; `stargazers_count` ve `pushed_at`'e göre sırala; `topics` rozet olarak göster. Belirli repoları sabitlemek için `Project.githubRepo` kullanılır (GitHub'ın "pinned" alanı REST'te yok, GraphQL gerekir ve token ister; gerek yok).

### 4.2 Rate limit
- Anonim: **saat başına 60 istek / IP** (ziyaretçinin IP'si başına, çünkü istek tarayıcıdan gider). Portfolyo ziyaretçisi başına 2 istek yeter; sorun olmaz ama aynı ağdaki (okul/ofis) kişiler limiti paylaşır.
- Token'lı: saatte 5000. Token yalnızca backend'de tutulur, asla frontend bundle'ına konmaz (`VITE_` ile başlayan her değişken herkese açıktır).
- Yanıt başlıkları: `X-RateLimit-Remaining`, `X-RateLimit-Reset`. 403/429 gelirse UI bozulmamalı.

### 4.3 Önbellek stratejisi
Faz 1 (frontend'den doğrudan):
1. `sessionStorage`/`localStorage` içinde `{data, fetchedAt}` sakla, **TTL 1 saat**.
2. Önce cache'i göster, süresi dolmuşsa arka planda yenile (stale-while-revalidate).
3. `ETag`/`If-None-Match` gönder: `304` yanıtları rate limite sayılmaz.
4. Hata/limit: son cache'i, o da yoksa `Project` verilerinden (statik JSON) üretilen kartları göster; "GitHub'a ulaşılamadı" notu ile.
5. React tarafında TanStack Query kullanılabilir (`staleTime: 1h`, `retry: 1`) veya küçük bir `useGithub` hook'u.

Faz 3 (backend proxy):
- Sunucu bellekte (Map) **10-15 dk** cache tutar; token ile çağırır; ziyaretçi sayısından bağımsız 1 istek.
- Yanıt: `Cache-Control: public, max-age=600, stale-while-revalidate=3600`.
- GitHub hata verirse sunucu son iyi cache'i döner.

### 4.4 Frontend mi, proxy mi?
**Öneri: Faz 1'de frontend'den doğrudan, cache'li.** Gerekçe: backend yok, ödev için yeterli, GitHub API CORS'a izin verir. Proxy yalnızca şu durumlarda eklenir: rate limit sorun olursa, pinned/GraphQL veya özel veri gerekirse, ya da tek tutarlı cache isteniyorsa. Soyutlama: `GithubSource` arayüzü (`getProfile()`, `getRepos()`) - `ContentSource` ile aynı mantık; doğrudan ve proxy implementasyonları değiştirilebilir.

Tip örneği:
```ts
export interface GithubRepo {
  name: string; description: string | null; htmlUrl: string; homepage: string | null;
  language: string | null; stars: number; forks: number; topics: string[]; pushedAt: string;
}
export interface GithubProfile {
  login: string; name: string | null; avatarUrl: string; bio: string | null;
  publicRepos: number; followers: number; htmlUrl: string;
}
```
Repo açıklamaları GitHub'dan geldiği için çevrilmez; iki dilli metin gereken yerde `Project.summary` kullanılır.

---

## 5. İletişim formu stratejisi

| Seçenek | Artı | Eksi |
|---|---|---|
| **A. `mailto:` bağlantısı** | Sıfır altyapı, Faz 1 ile hemen çalışır | Kullanıcının mail istemcisi gerekir, form hissi yok |
| B. Formspree / Web3Forms / Formsubmit | Backend'siz gerçek form, ücretsiz kota | Üçüncü taraf bağımlılığı, spam kotası |
| C. Kendi `POST /api/contact` + Nodemailer (veya Resend) | Tam kontrol, mesajlar admin'de görülebilir | SMTP/API anahtarı, spam koruması, bakım |

**Öneri:** Faz 1'de **A** (e-posta + kopyala butonu). Form görseli istenirse B (Web3Forms). Faz 2'de zaman kalırsa C; mesajları `messages.json`'a yazıp admin'de listelemek vize için etkileyici bir ek olur.

C seçilirse: Zod doğrulama (ad, e-posta, mesaj <= 2000 karakter), honeypot alanı, IP başına dakikada 3 istek limiti, başlık enjeksiyonuna karşı e-posta alanında satır sonu yasağı, alıcı adres yalnızca sunucu env'inde.

---

## 6. Admin güvenlik notları

- **Parola:** Düz metin saklanmaz. `argon2` (veya `bcryptjs`, native derleme istemediği için Windows'ta kolay) ile hash; hash `.env`'de (`ADMIN_PASSWORD_HASH`). Hash üretme için tek seferlik `npm run hash-password` betiği.
- **JWT:** `JWT_SECRET` en az 32 rastgele bayt, `.env`'de. Ömür 1-2 saat; `httpOnly; Secure; SameSite=Lax` (cross-site dağıtımda `SameSite=None; Secure`) cookie. `localStorage`'a token koyma (XSS riski).
- **CSRF:** Cookie kullanıldığı için state değiştiren isteklerde `Origin` kontrolü veya double-submit token; `SameSite` ek koruma.
- **Rate limit:** `express-rate-limit`: genel `100/15dk`, `/api/auth/login` için `5/15dk` + başarısız denemede artan gecikme. `/api/contact` için ayrı ve sıkı limit.
- **CORS:** `cors({ origin: [FRONTEND_URL], credentials: true })`; `*` kullanma. Yerel geliştirme için `http://localhost:5173` env ile eklenir.
- **Başlıklar:** `helmet()`, `app.disable('x-powered-by')`, `express.json({ limit: '100kb' })`.
- **Doğrulama/çıktı:** Tüm girdi Zod; URL alanlarında yalnızca `http(s):` ve `mailto:` izin ver (`javascript:` linklerini engelle). İçerik düz metin olarak render edilir; HTML/Markdown desteklenirse sanitize et (DOMPurify). React varsayılan olarak kaçışlar, `dangerouslySetInnerHTML` kullanma.
- **Yükleme:** Yalnızca `image/png|jpeg|webp`, 2 MB sınırı, rastgele dosya adı, uzantıyı MIME'dan türet.
- **Env yönetimi:** `.env` asla git'e girmez (`.gitignore`), `.env.example` commit edilir. Gizli değerler: `JWT_SECRET`, `ADMIN_PASSWORD_HASH`, `GITHUB_TOKEN`, SMTP/Resend anahtarı. Frontend yalnızca `VITE_API_URL` gibi **herkese açık** değerleri bilir.
- **Yazma güvenliği:** JSON dosyasına atomik yazma (tmp + rename), yazma öncesi `data.bak.json` yedeği; tek süreç varsayımı (mutex).
- **Loglama:** Giriş denemelerini logla (parola asla loglanmaz). Admin yolunu `/admin` olarak bırakmak güvenlik değildir; asıl koruma auth'tur.
- **Uyarı:** Render/Vercel gibi servislerin disk sistemi **geçicidir** (bkz. bölüm 8); JSON'a yazan admin ücretsiz barındırmada deploy/yeniden başlatmada sıfırlanabilir.

---

## 7. Klasör yapısı (monorepo: `/web`, `/server`)

```
website/
  docs/                      # planlama dokümanları (bu dosya dahil)
  package.json               # npm workspaces: ["web","server","shared"]
  .gitignore
  README.md
  shared/                    # (opsiyonel) ortak tipler ve Zod şemaları
    src/schema.ts            # LocalizedText, Project... + Zod; web ve server import eder
  web/
    index.html
    vite.config.ts
    .env.example             # VITE_API_URL=
    public/
      images/ cv/
    src/
      main.tsx  App.tsx
      content/               # types.ts + *.json (Faz 1 içeriği)
      data/                  # ContentSource, Static/Http, ContentProvider, github/
      i18n/                  # t(), dil yönetimi, fallback
      components/ pages/ styles/
      admin/                 # Faz 2: /admin rotaları (lazy-loaded)
  server/
    package.json  tsconfig.json
    .env.example             # PORT, FRONTEND_URL, JWT_SECRET, ADMIN_PASSWORD_HASH, GITHUB_TOKEN
    data/                    # profile.json, projects.json ... (seed = web/src/content)
    uploads/
    scripts/hash-password.ts
    src/
      index.ts               # app kurulumu, middleware
      config.ts              # env doğrulama (Zod)
      routes/                # content.ts, admin.ts, auth.ts, github.ts, contact.ts
      repositories/          # Repository arayüzü + JsonFileRepository
      middleware/            # auth.ts, rateLimit.ts, errorHandler.ts
      schemas/               # (shared yoksa) Zod şemaları
```

Basit tutmak için `shared/` atlanabilir: Faz 1'de tipler `web/src/content/types.ts`'te kalır, Faz 2'de sunucu bu dosyayı relative import eder veya kopyalar. Önce `web` kurulur; `server` Faz 2'de eklenir, o zamana dek klasör oluşturulmaz.

Betikler (kök `package.json`): `dev:web`, `dev:server`, `dev` (concurrently), `build`, `lint`. Vite dev'de `server.proxy: { '/api': 'http://localhost:3001' }` ile CORS sorunu yaşanmaz.

---

## 8. Deploy önerisi (ücretsiz)

**Faz 1 (statik): Vercel veya Netlify -> `web/` klasörü.**
- Build: `npm run build`, çıktı `dist`. GitHub reposu bağlanınca her push otomatik yayınlanır.
- SPA yönlendirmesi: Vercel `vercel.json` rewrites (`/(.*)` -> `/index.html`) veya Netlify `_redirects` (`/* /index.html 200`).
- Env: `VITE_API_URL` panelden girilir.
- Öneri: **Vercel** (veya Netlify; ikisi de bu iş için eşdeğer). Custom domain ücretsiz.

**Faz 2 (backend): Render (Web Service, ücretsiz plan) veya Railway/Fly.io.**
- Render ücretsiz plan: 15 dk hareketsizlikte uyur, ilk istek ~30-60 sn sürer; frontend'deki statik fallback bunu maskeler. Disk kalıcı değil.
- **Kalıcılık sorunu ve çözümler (sırayla basitten):**
  1. Admin değişikliklerini JSON dosyasına yazıp **GitHub'a commit eden** akış (GitHub Contents API) - karmaşık.
  2. JSON yerine ücretsiz barındırılan veritabanına geç: **SQLite -> Turso (libSQL)**, ya da **Neon/Supabase Postgres**, ya da **MongoDB Atlas**. Repository arayüzü sayesinde yalnızca tek dosya değişir. En sağlam yol budur.
  3. Vize demosu için: admin yerelde (localhost) çalışır, içerik JSON'a yazılır, JSON git'e commit edilir, canlı site yine statik kalır. Ödev için en az riskli seçenek.
- CORS'ta `FRONTEND_URL` olarak Vercel alan adı verilir; cookie için `SameSite=None; Secure` gerekir (farklı alan adları). Aynı kök alan adının alt alan adlarını kullanmak (`app.` ve `api.`) cookie sorununu azaltır.

**Önerilen yol (özet):** Vize için Faz 1'i Vercel'e statik yayınla; admin tamamlandığında ya (3) yerel-admin+commit akışını kullan ya da Turso/Neon ile Render'a taşı. Basit olan, ödev ölçeğinde yeterli olan seçimdir.

---

## Açık kararlar (kullanıcıdan teyit)
1. GitHub kullanıcı adı (profile.json'daki `githubUsername`).
2. Faz 1'de iletişim: yalnızca `mailto:` mu, yoksa Web3Forms/Formspree formu mu?
3. Admin canlı sitede mi çalışsın, yoksa yalnızca yerelde mi (bölüm 8 kalıcılık kararını etkiler)?
4. Tam iki dilli içerik zorunlu mu, yoksa `en` boşsa `tr`'ye fallback kabul mü?
