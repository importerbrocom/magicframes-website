# Putting your website live on Hostinger

This guide assumes **no software installed on your computer** — no Node.js, no
npm, no code editor. Everything is done through GitHub's website and Hostinger's
control panel.

You will do this **once**. After that, adding photos and videos happens through
your admin dashboard, with no uploading.

**Roughly 20 minutes.** Have your Hostinger login ready.

---

## Step 1 — Download the website files from GitHub

1. Go to the repository:
   <https://github.com/importerbrocom/magicframes-website/tree/feat/magicframes-website>
2. Click the green **`< > Code`** button (top right of the file list).
3. Click **Download ZIP**.
4. Find the ZIP in your Downloads folder and **extract / unzip it**
   (Windows: right-click → *Extract All*. Mac: double-click it).

You now have a folder named something like
`magicframes-website-feat-magicframes-website`.

5. Open it and go into the **`deploy`** folder.

> **The `deploy` folder is the only one you need.** Everything else in the
> download is source code that does not go on your server.

Inside `deploy` you should see: `index.html`, `admin`, `_next`, `api`,
`uploads`, `404.html`, and `READ-ME-FIRST.txt`.

---

## Step 2 — Create the database

1. Log in to Hostinger → **hPanel**.
2. Go to **Databases → MySQL Databases**.
3. Create a new database. Hostinger will ask for a database name, a username,
   and a password.
4. **Write these four things down** — you need them in Step 5:

   | | Example | Yours |
   |---|---|---|
   | Database name | `u123456_magicframes` | |
   | Username | `u123456_admin` | |
   | Password | *(the one you chose)* | |
   | Host | `localhost` | |

> Hostinger usually prefixes names with your account number (`u123456_`). Use
> the full name exactly as shown in hPanel.

---

## Step 3 — Create the tables

1. In hPanel go to **Databases → phpMyAdmin** and click **Enter phpMyAdmin**
   next to your database.
2. In phpMyAdmin, click your database name in the left sidebar.
3. Click the **Import** tab at the top.
4. Click **Choose File** and select **`deploy/api/schema.sql`** from your
   extracted download.
5. Scroll down and click **Import** (or **Go**).

You should see a green success message. In the left sidebar you will now see
five tables: `gallery_images`, `gallery_videos`, `projects`, `admin_users`,
and `login_attempts`.

---

## Step 4 — Upload the files

1. In hPanel go to **Files → File Manager**.
2. Open your **`mabsite`** folder (your website's main folder).
3. Turn on hidden files: click the **settings/gear icon** and enable
   **Show hidden files (dotfiles)**.

   > ⚠️ **Do not skip this.** Files like `.htaccess` start with a dot and are
   > invisible by default. They contain security rules that protect your
   > database password and stop malicious uploads.

4. Now upload **everything inside** your `deploy` folder into `mabsite`.

   **The easy way:** on your computer, select all the items *inside* `deploy`,
   right-click → **compress / zip** them into one file. Upload that single ZIP
   to `mabsite`, then right-click it in File Manager → **Extract**. Delete the
   ZIP afterwards.

When you're done, `mabsite` should look like this:

```
mabsite/
├── index.html
├── 404.html
├── admin/
├── _next/
├── api/
└── uploads/
```

> ❗ If you see `mabsite/deploy/index.html`, you uploaded the folder instead of
> its contents. Move the files up one level.

---

## Step 5 — Add your database details

1. In File Manager, open **`mabsite/api/`**.
2. Find **`config.sample.php`**. Right-click → **Copy**, and name the copy
   **`config.php`** (in the same `api` folder).
3. Right-click **`config.php`** → **Edit**.
4. Fill in the four values from Step 2:

```php
'driver'   => 'mysql',
'host'     => 'localhost',
'dbname'   => 'u123456_magicframes',   // your database name
'user'     => 'u123456_admin',         // your username
'password' => 'your-database-password',// your password
```

5. **Save**.

> This file stays on your server and is blocked from public access, so visitors
> can never read your password.

---

## Step 6 — Set the uploads folder permissions

1. In File Manager, right-click the **`uploads`** folder inside `mabsite`.
2. Choose **Permissions** (or **CHMOD**).
3. Set it to **755** and save.

This lets the website save photos you upload later.

---

## Step 7 — Create your admin login

**No SSH needed.** The file `api/setup_admin_web.php` is already in the files you
uploaded. It is a one-time setup page.

1. In your browser, go to:

   ```
   https://yourdomain.com/api/setup_admin_web.php
   ```

2. Choose a **username** and a **password** (at least 8 characters), and confirm
   the password.
3. Click **Create admin user**.

You'll see *"Admin user created"*, and **the page deletes itself** so nobody
else can ever use it.

> If it reports that it could not delete itself, remove
> `api/setup_admin_web.php` manually in File Manager. It also refuses to run at
> all once an admin exists, so it cannot be used against you.

Your password is encrypted (bcrypt) **on your own server** — it is never sent to
any other website.

<details>
<summary>Prefer the command line? (only if you do have SSH)</summary>

```bash
ssh -p 65002 YOUR_SSH_USERNAME@YOUR_SERVER_IP
cd ~/domains/YOURDOMAIN.com/mabsite
php api/setup_admin.php yourname 'YourStrongPassword123'
```

Keep the single quotes around the password.

</details>

<details>
<summary>Forgot your password later?</summary>

1. In phpMyAdmin, select your database → **SQL** tab → run:

   ```sql
   DELETE FROM admin_users;
   ```

2. Re-upload `api/setup_admin_web.php` from the GitHub download.
3. Visit the URL again and create a new login.

</details>

---

## Step 8 — Turn on HTTPS

1. hPanel → **Security → SSL** and install the free SSL certificate.
2. Then enable **Force HTTPS**.

Your admin login sends a password, so this is important.

---

## Step 9 — You're live 🎉

- Your website: **`https://yourdomain.com`**
- Your dashboard: **`https://yourdomain.com/admin/`**

Sign in with the username and password from Step 7. The dashboard header should
read **"Connected to your MySQL database"** — that confirms everything is wired
up correctly.

Now add your real photos and videos through the **Images**, **Videos**, and
**Projects** tabs. Each image slot shows the size it expects (e.g.
`1600 x 1067`) so you know what to upload.

---

## If something goes wrong

| What you see | What it means | Fix |
|---|---|---|
| "We couldn't load the photos" | The site can't reach the database | Re-check Step 5 — database name, username, password spelled exactly as in hPanel |
| Page loads but is unstyled | The `_next` folder is missing | Re-upload it; make sure hidden files were shown |
| `/admin/` shows "Not Found" | The `admin` folder didn't upload | Re-upload the `admin` folder |
| "Database error… schema was imported" | Tables weren't created | Redo Step 3 |
| Photo upload fails | Folder isn't writable | Redo Step 6 (permissions 755) |
| Can't log in | Admin user wasn't created | Redo Step 7 |
| Setup page says "Already set up" | An admin already exists | Log in, or run `DELETE FROM admin_users;` in phpMyAdmin and retry |
| Setup page says "Tables not created" | Schema wasn't imported | Redo Step 3 |
| Setup page says "Database not connected" | `config.php` details are wrong | Recheck Step 5 |
| Locked out after wrong passwords | Security lockout (5 tries) | Wait 15 minutes |

Still stuck? Tell me what you see and I'll help.

---

## Updating the site later

**Adding photos, videos, or projects** → just use `/admin/`. No uploading.

**Changing the design or adding features** → I make the change, rebuild, and
push it to GitHub. You then re-download the ZIP and re-upload only the parts
that changed (usually `index.html`, `_next/`, and `admin/`).

You never need to touch `config.php` again, and you never re-import the database.
