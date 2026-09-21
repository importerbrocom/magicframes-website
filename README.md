# MagicFrames — Wedding Photography & Films

A modern, mobile-first marketing site for the MagicFrames wedding company, with
a password-protected admin dashboard for managing the image gallery, video
gallery, and latest projects.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion**
and shipped as a **static export** so it can be hosted on a Hostinger web plan.
Videos are embedded from **YouTube / Vimeo** (not self-hosted).

---

## Highlights

- Mobile-first, animated design (Framer Motion scroll reveals, hover effects, an
  animated mobile menu).
- Public sections: Hero, About, Image Gallery, Video Gallery, Latest Projects,
  Contact.
- Admin dashboard at `/admin` to add / edit / delete content in all three areas.
- Two data backends behind one interface:
  - **Local fallback** (default): works with **zero external accounts** — no
    setup, no keys. Content is stored in the browser via `localStorage`.
  - **Supabase** (optional): a free managed Postgres database so content is
    shared across all visitors and devices.
- Every image slot is an annotated placeholder (e.g. `1600 x 1067`) so you know
  exactly what size to upload before you have real photos.

> **Contact form:** since there is no server, the form composes a `mailto:`
> link that opens the visitor's email app. Very long messages can exceed
> browser/OS URL limits, so the form detects that case and asks the visitor to
> email `hello@magicframes.studio` directly instead of silently truncating. The
> studio email is also always shown as a plain link beside the form.

---

## Local development (no accounts needed)

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000> for the site and
<http://localhost:3000/admin> for the dashboard.

With no environment variables set, the app uses the **local fallback** data
provider seeded with placeholder demo content, so everything works immediately
with no Supabase account.

### Admin login (local fallback)

The dashboard is protected by a password gate. The password comes from
`NEXT_PUBLIC_ADMIN_PASSWORD`; if that is not set, a development default is used:

```
magicframes
```

Set your own before deploying (see below). The auth flag is stored in
`sessionStorage`, so it clears when you close the browser tab.

> **⚠️ Security: the local-fallback password is UI-gating only, not access
> control.** Because this is a static export, every `NEXT_PUBLIC_*` value —
> including `NEXT_PUBLIC_ADMIN_PASSWORD` — is **baked into the shipped
> JavaScript at build time** and can be read by anyone who opens the browser
> devtools. The password only keeps casual visitors out of the dashboard UI; it
> is *not* a real authentication boundary. This is acceptable in fallback mode
> because fallback writes only touch the visitor's own browser `localStorage`
> and can never affect other visitors or your live content.
>
> **For any real deployment, use the Supabase path (below).** With Supabase
> configured, `/admin` authenticates through **Supabase Auth** (credentials
> validated server-side, never shipped in the bundle) and the database's Row
> Level Security policies allow public reads but restrict writes to
> authenticated admins. That is the intended production posture.

> **Note on the local fallback:** content added through the dashboard is saved
> in *that browser only* (`localStorage`). It is perfect for previewing and for
> filling in real content sizes, but for a live site where content must be
> shared across all visitors, use Supabase (below).

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you need. All variables are
optional for local development.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. Set **both** Supabase vars to switch from the local fallback to Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key. |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Password for `/admin` in local-fallback mode. Defaults to `magicframes` if unset. **UI-gating only** — it is baked into the client bundle, so treat it as a soft gate and use Supabase Auth for real access control. |

Because this is a **static export**, all `NEXT_PUBLIC_*` values are baked into
the site **at build time** — you must set them *before* running `npm run build`,
not on the server afterwards.

---

## Optional: connect Supabase (shared content)

Use Supabase when you want content to be shared across all visitors and to
manage it from any device.

1. Create a free project at <https://supabase.com>.
2. In the Supabase dashboard go to **SQL Editor → New query**, paste the
   contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This
   creates the `gallery_images`, `gallery_videos`, and `projects` tables with
   public-read / admin-write Row Level Security policies.
3. Create your admin user: **Authentication → Users → Add user** (email +
   password). You will sign in with this on `/admin`.
4. In **Project Settings → API**, copy the **Project URL** and the **anon
   public** key into `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

5. Restart `npm run dev`. The `/admin` login now asks for the Supabase email +
   password, and all content reads/writes go to your database.

### Image uploads with Supabase Storage (optional)

The forms accept an image **URL**. To host photos on Supabase, create a public
Storage bucket (**Storage → Create bucket → `media` → Public: ON**), upload your
images, and paste each file's public URL into the image/cover fields. See the
notes at the bottom of `supabase/schema.sql`.

---

## Managing content in `/admin`

Go to `/admin`, log in, and use the tabs:

- **Images** — title, image URL, alt text, and **width/height** (required).
- **Videos** — title, provider (YouTube/Vimeo), and the video **URL or ID**
  (paste the full share link — the ID is parsed automatically), plus thumbnail
  **width/height**. **Unlisted Vimeo videos are supported**: paste the full
  private link (e.g. `https://vimeo.com/123456789/abcdef123` or a
  `?h=abcdef123` link) and the privacy hash is preserved so the embed loads.
- **Projects** — title, description, date, cover image URL, and cover
  **width/height** (required).

Lists refresh after every add / edit / delete, and the changes appear in the
matching section on the public site.

### How placeholder dimensions work & swapping in real images

Every image slot renders a labeled placeholder box showing its intended size
(e.g. `1600 x 1067`). The number comes from the width/height you enter, which is
why those fields are required — they keep each slot correctly sized and
documented while you gather real photos.

To swap in a real image, simply edit the item and paste an image **URL** into
the URL field (an external link, a `/public` path, or a Supabase Storage URL).
As soon as a `src` is present, the placeholder is replaced by the real image at
the same dimensions. No code changes needed.

Recommended sizes used by the design:

| Slot | Suggested size |
| --- | --- |
| Hero background | 1920 x 1080 |
| About portrait | 800 x 1000 |
| Gallery image | 1600 x 1067 (varies) |
| Video thumbnail | 1280 x 720 |
| Project cover | 600 x 400 |

---

## Build

```bash
npm run build
```

This produces a fully static site in the `out/` directory (via
`output: 'export'` in `next.config.mjs`). The `/admin` route is included in the
export.

---

## Deployment

### A) Primary path — static export to Hostinger (web plan)

Hostinger's shared **web plan** serves static files (HTML/CSS/JS) and does **not
run a persistent Node.js server**. This project is built as a static export
specifically for that.

1. **Set your env vars first** (they are baked in at build time). If you use
   Supabase, put the two `NEXT_PUBLIC_SUPABASE_*` values in `.env.local`; always
   set a strong `NEXT_PUBLIC_ADMIN_PASSWORD` if you are relying on the local
   fallback. **Rebuild any time these change.**
2. Build the static site:

   ```bash
   npm run build
   ```

3. Open the generated **`out/`** folder. Upload **everything inside `out/`**
   (not the folder itself) into your domain's `public_html` directory, using
   either:
   - **hPanel → File Manager** — enter `public_html`, upload a zip of the
     contents of `out/`, then extract it there; or
   - **FTP** (FileZilla) — connect with your Hostinger FTP credentials and copy
     the contents of `out/` into `public_html`.

4. Visit your domain. The site is live, and `/admin/` works from the browser.

> Because the site is static, **Supabase env vars must be set at build time** —
> there is no server on Hostinger to inject them at runtime. If you change
> Supabase keys or the admin password, rebuild and re-upload `out/`.

> Content added in the **local fallback** mode lives only in the browser that
> added it, so for a shared live site connect Supabase before building.

### B) Alternative — deploy the full app to Vercel + point Hostinger's domain

If you prefer a hosted Node environment (e.g. to add server features later),
deploy to Vercel and use your Hostinger domain via DNS:

1. Push this repo to GitHub and import it at <https://vercel.com/new>.
2. Add the same environment variables in **Vercel → Project → Settings →
   Environment Variables**.
3. Deploy. Vercel gives you a URL like `your-site.vercel.app`.
4. In Vercel, add your custom domain and follow its DNS instructions.
5. In **Hostinger → hPanel → DNS / Nameservers**, point the domain at Vercel
   (either update the `A` / `CNAME` records Vercel provides, or set Vercel's
   nameservers). DNS changes can take some time to propagate.

---

## Project structure

```
app/                 App Router pages (public site + /admin)
components/          UI, section components, PlaceholderImage, animation helpers
components/admin/    Admin dashboard (tabs + Images/Videos/Projects managers)
lib/                 Types, data providers (local + Supabase), auth, helpers
supabase/schema.sql  Database schema + RLS + storage notes
public/              Static assets
out/                 Static export produced by `npm run build` (gitignored)
```
