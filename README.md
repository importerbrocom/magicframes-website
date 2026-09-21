# MagicFrames — Wedding Photography & Films

A modern, mobile-first website for the MagicFrames wedding company, with a
password-protected admin dashboard for managing the image gallery, video
gallery, and latest projects.

Built for **Hostinger shared hosting**:

- **Front end** — Next.js (App Router) + TypeScript + Tailwind CSS + Framer
  Motion, exported as a **static site** (plain HTML/CSS/JS, no Node needed).
- **Back end** — a small **PHP + MySQL** REST API in [`api/`](api), because
  Hostinger's web plan provides PHP and MySQL but no Node.js runtime.
- **Videos** are embedded from **YouTube / Vimeo** (never uploaded).

> **Why a PHP API?** A browser cannot connect to MySQL directly, and it must
> never hold your database password. The PHP API is the server-side layer in
> between: the browser calls `/api/...`, and only PHP ever sees the credentials.

---

## Highlights

- Mobile-first animated design (Framer Motion scroll reveals, hover effects,
  animated mobile menu).
- Public sections: Hero, About, Image Gallery, Video Gallery, Latest Projects,
  Contact.
- Admin dashboard at `/admin` with add / edit / delete for all three content
  areas, plus **drag-free image uploads** straight to your server.
- **Real server-side login** — passwords are bcrypt-hashed in MySQL and verified
  by PHP. Nothing secret is shipped to the browser.
- Every image slot is an annotated placeholder (e.g. `1600 x 1067`) so you know
  exactly what size to upload before you have real photos.

---

## Deploying to Hostinger

Your document root folder is called **`mabsite`**. The finished layout is:

```
mabsite/
├── index.html          ← from out/
├── admin/index.html    ← from out/
├── 404.html            ← from out/
├── _next/              ← from out/   (CSS + JS)
├── api/                ← the PHP backend (this repo's api/ folder)
│   └── config.php      ← you create this on the server (never committed)
└── uploads/            ← uploaded photos land here
```

### Step 1 — Create the database

In **hPanel → Databases → MySQL Databases**, create a database and a user, and
note the **database name**, **username**, **password**, and **host** (usually
`localhost` on Hostinger).

### Step 2 — Import the tables

Import [`api/schema.sql`](api/schema.sql) using either:

- **phpMyAdmin** — hPanel → Databases → phpMyAdmin → select your database →
  **Import** → choose `api/schema.sql` → **Go**; or
- **SSH** —

  ```bash
  mysql -u YOUR_DB_USER -p YOUR_DB_NAME < api/schema.sql
  ```

This creates `gallery_images`, `gallery_videos`, `projects`, and `admin_users`.

### Step 3 — Build the static site

On your own computer (Node.js 18+ required just for this build step):

```bash
npm install
npm run build
```

This produces the **`out/`** folder. No configuration is needed: the app calls
`/api` on its own domain by default.

### Step 4 — Upload the files

Upload into `mabsite/` using **hPanel → File Manager** or FTP/SFTP:

1. Everything **inside** `out/` (not the folder itself) → `mabsite/`
2. The whole **`api/`** folder → `mabsite/api/`
3. Create an empty **`uploads/`** folder → `mabsite/uploads/`, and set its
   permissions to **755** so PHP can write to it.

Over SSH you can copy it all in one go:

```bash
rsync -avz -e "ssh -p 65002" out/ USER@SERVER:~/domains/YOURDOMAIN/mabsite/
rsync -avz -e "ssh -p 65002" api  USER@SERVER:~/domains/YOURDOMAIN/mabsite/
```

### Step 5 — Add your database credentials (server-side only)

Over SSH, or with the File Manager's editor:

```bash
cd ~/domains/YOURDOMAIN/mabsite/api
cp config.sample.php config.php
nano config.php        # fill in dbname, user, password (and host if needed)
```

`config.php` is gitignored and blocked from web access by `api/.htaccess`, so
your password never reaches a visitor's browser.

### Step 6 — Create your admin login

Still over SSH, from the `mabsite` folder:

```bash
php api/setup_admin.php your-username 'your-strong-password'
```

Wrap the password in single quotes so the shell doesn't interpret `$` or `!`.
Re-running the command for the same username **changes** that user's password.

No SSH? Generate a hash and insert it manually — see the instructions at the
bottom of [`api/schema.sql`](api/schema.sql).

### Step 7 — Sign in

Visit `https://yourdomain.com/admin/` and log in. The header should read
**"Connected to your MySQL database"**.

---

## Managing content

Go to `/admin`, sign in, then use the tabs:

- **Images** — title, alt text, and width/height. Either paste an image URL or
  use **Or upload a photo** to upload a file; the width and height fill in
  automatically from the uploaded image.
- **Videos** — title, provider (YouTube/Vimeo), and the video **URL or ID**
  (paste the full share link — the ID is extracted for you), plus thumbnail
  size. **Unlisted Vimeo links work**: paste the full private URL
  (`https://vimeo.com/123456789/abcdef123`) and the privacy hash is preserved.
- **Projects** — title, description, date, and a cover image (URL or upload).

Changes appear on the public site immediately.

### Placeholders and image sizes

Every image slot renders a labelled placeholder showing its intended size (e.g.
`1600 x 1067`) until a real image is set, which is why width/height are
required. Uploading a photo replaces the placeholder at the same slot.

Sizes used by the design:

| Slot | Suggested size |
| --- | --- |
| Hero background | 1920 x 1080 |
| About portrait | 800 x 1000 |
| Gallery image | 1600 x 1067 (varies) |
| Video thumbnail | 1280 x 720 |
| Project cover | 600 x 400 |

Uploads accept **JPG, PNG, WebP, or GIF up to 8 MB**. The server verifies that a
file really is an image, renames it randomly, and refuses anything executable.

---

## Local development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Two options for the data layer:

**a) Design-only mode (no database).** Put this in `.env.local`:

```bash
NEXT_PUBLIC_USE_LOCAL=1
```

Content is kept in your browser's `localStorage`, seeded with demo placeholders,
and `/admin` uses a simple development password (`magicframes`, override with
`NEXT_PUBLIC_ADMIN_PASSWORD`). Nothing is shared between browsers — this mode is
for working on the design offline.

**b) Against a real PHP + MySQL backend.** Serve the built site and `api/`
together from one document root, exactly like production:

```bash
npm run build
mkdir -p /tmp/site && cp -r out/* /tmp/site/ && cp -r api /tmp/site/
mkdir -p /tmp/site/uploads
cp api/config.sample.php /tmp/site/api/config.php   # then edit it
php -S 127.0.0.1:8080 -t /tmp/site
```

For a quick test without MySQL, `api/config.php` also accepts
`'driver' => 'sqlite'` with a `'sqlite_path'`.

---

## Environment variables

All optional — the defaults suit a normal Hostinger deployment. Copy
`.env.example` to `.env.local` to change them.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Where the PHP API lives. Defaults to the relative `/api`, correct when the site and `api/` share a document root. Set it only if the API is on another domain. |
| `NEXT_PUBLIC_USE_LOCAL` | Set to `1` to bypass the API and keep content in `localStorage` (design-only mode). |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Development password, used **only** when `NEXT_PUBLIC_USE_LOCAL=1`. Irrelevant in production. |

> Because the site is a **static export**, these are baked in at **build time** —
> change one and run `npm run build` again. Your **database credentials are not
> among them**: they live only in `api/config.php` on the server.

---

## Security notes

- Admin passwords are stored as bcrypt hashes (`password_hash`) and verified
  server-side; the session is an HttpOnly cookie.
- Every create / update / delete / upload endpoint rejects unauthenticated
  requests with `401`. Public reads are the only unauthenticated operation.
- All SQL uses prepared statements with bound parameters.
- Uploads are validated by extension **and** real MIME type, stored under
  randomized filenames, and `uploads/.htaccess` disables script execution there.
- `api/.htaccess` blocks direct access to `config.php`, `api/lib/`, the schema,
  and `setup_admin.php` (which also refuses to run over HTTP).
- Consider deleting `api/setup_admin.php` from the server once your admin user
  exists.

---

## The contact form

There is no mail server involved: the form opens the visitor's email app via a
`mailto:` link. Very long messages can exceed URL limits, so the form detects
that and shows a direct email address instead. The studio email is always
visible beside the form as a plain link.

---

## Project structure

```
app/                  App Router pages (public site + /admin)
components/           Sections, admin managers, PlaceholderImage, animations
lib/types.ts          Shared content types
lib/data/api.ts       Data provider backed by the PHP API (+ image upload)
lib/data/local.ts     localStorage provider for design-only mode
lib/data/provider.ts  Provider interface and selection
lib/auth.ts           Admin login against api/auth.php
api/                  PHP + MySQL backend
  schema.sql          MySQL tables (import this once)
  config.sample.php   Copy to config.php on the server
  auth.php            Login / logout / session check
  images.php          Image gallery CRUD
  videos.php          Video gallery CRUD
  projects.php        Latest Projects CRUD
  upload.php          Authenticated image upload
  setup_admin.php     CLI-only admin user creation
  lib/                PDO bootstrap, helpers, UUID, shared CRUD
uploads/              Uploaded images (runtime; gitignored)
out/                  Static export from `npm run build` (gitignored)
```
