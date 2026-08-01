# Digital Gyaan — cPanel Deployment Guide

This package contains a **production-ready launch version** of Digital Gyaan:
Homepage, article pages, categories, tags, search, full admin panel
(login + create/edit/publish articles + featured image upload), SEO
metadata, sitemap.xml, robots.txt, rss.xml, responsive design, centralized
error handling, and security hardening (helmet, rate limiting, input
sanitization, JWT auth with rotation, RBAC).

Advanced items (rich comment moderation UI, likes/bookmarks UI polish,
analytics dashboards, advanced admin tools) are intentionally deferred —
the underlying comment/like/bookmark APIs exist, but nothing about them
blocks launch.

## 1. Architecture — what runs where

This is **not a plain PHP app** — it's two Node.js processes:

- `backend/` — Express + TypeScript API, talks to **MongoDB** (use MongoDB
  Atlas' free tier — almost no cPanel shared host runs MongoDB itself)
  and **Cloudinary** (image hosting/CDN for uploads).
- `frontend/` — Next.js 15 (App Router), server-rendered, calls the backend
  API.

**Requirement:** your cPanel host must offer **"Setup Node.js App"**
(Node.js Selector, powered by Passenger). This is standard on cPanel/WHM
hosts released in the last several years (A2 Hosting, Namecheap Stellar+,
Hostinger Business, InMotion, etc.). If your host only offers plain PHP
hosting with no Node.js Selector, you cannot deploy this app there — you'd
need a VPS or a Node-capable host instead. Check under cPanel → **Software
→ Setup Node.js App** before proceeding.

You will create **two separate Node.js apps** in cPanel:
1. `api.yourdomain.com` → `backend/`
2. `yourdomain.com` (or `www`) → `frontend/`

## 2. Prerequisites (create these accounts first)

### 2.1 MongoDB Atlas (free tier is enough to launch)
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Database Access → add a user with a strong password.
3. Network Access → add IP `0.0.0.0/0` (allow from anywhere) — cPanel
   shared IPs are usually not static, so this is the practical choice;
   your DB user/password is still required to connect.
4. Get your connection string (Connect → Drivers → Node.js), it looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/digital-gyaan?retryWrites=true&w=majority`

### 2.2 Cloudinary (free tier is enough to launch)
1. Sign up at https://cloudinary.com
2. Dashboard gives you: Cloud Name, API Key, API Secret — copy these.

### 2.3 SMTP (for password reset / newsletter emails)
Use your host's SMTP, or a transactional provider (Brevo, SES, Mailgun,
or even Gmail with an App Password for low volume).

## 3. Upload the code

1. In cPanel → **File Manager**, create `~/digital-gyaan/` outside
   `public_html` (Node apps don't need to live in `public_html`).
2. Upload this ZIP and extract it there, OR use cPanel → Git Version
   Control if you push this to a repo.
3. You should end up with:
   ```
   ~/digital-gyaan/backend/
   ~/digital-gyaan/frontend/
   ```

## 4. Deploy the backend (API)

1. cPanel → **Setup Node.js App** → **Create Application**
   - Node.js version: **18.x or newer** (20.x recommended)
   - Application mode: **Production**
   - Application root: `digital-gyaan/backend`
   - Application URL: `api.yourdomain.com` (create this subdomain first
     under Domains if it doesn't exist)
   - Application startup file: `dist/server.js`
2. Click **Create**. cPanel provisions a virtual environment and gives you
   a command like `source /home/.../nodevenv/.../bin/activate` — you'll
   use the **Run NPM Install** button in the same screen instead of typing
   this manually where possible.
3. Under the app's **Environment variables**, add every variable from
   `backend/.env.example`, with real values:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | (leave as cPanel assigns, e.g. auto-filled) |
   | `API_URL` | `https://api.yourdomain.com` |
   | `CLIENT_URL` | `https://yourdomain.com` |
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_ACCESS_SECRET` | long random string (see §6) |
   | `JWT_REFRESH_SECRET` | a **different** long random string |
   | `JWT_ACCESS_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `30d` |
   | `COOKIE_SECRET` | another long random string |
   | `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard |
   | `CLOUDINARY_API_KEY` | from Cloudinary dashboard |
   | `CLOUDINARY_API_SECRET` | from Cloudinary dashboard |
   | `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASSWORD` | your SMTP provider |
   | `EMAIL_FROM` | `"Digital Gyaan <no-reply@yourdomain.com>"` |
   | `RATE_LIMIT_WINDOW_MS` | `900000` |
   | `RATE_LIMIT_MAX` | `300` |
   | `SITE_NAME` | `"Digital Gyaan"` |
   | `SITE_URL` | `https://yourdomain.com` |
   | `SEED_ADMIN_EMAIL` | the email you'll log into `/admin` with |
   | `SEED_ADMIN_PASSWORD` | a strong password (min 8 chars) |
   | `SEED_ADMIN_NAME` | your name |

4. Open the app's **Terminal** (cPanel gives you a "Run JS script" /
   terminal button once the app exists), and run:
   ```bash
   npm install
   npm run build         # compiles TypeScript to dist/
   mkdir -p logs          # required by the production file logger
   npm run seed           # creates your admin user + default categories
   ```
5. Click **Restart** on the Node app.
6. Verify: visit `https://api.yourdomain.com/api/v1/health` — should
   return `{"success":true,"database":"connected",...}`.
7. Verify SEO endpoints:
   - `https://api.yourdomain.com/sitemap.xml`
   - `https://api.yourdomain.com/robots.txt`
   - `https://api.yourdomain.com/rss.xml`

## 5. Deploy the frontend (website)

1. cPanel → **Setup Node.js App** → **Create Application**
   - Node.js version: same as backend (18.x+)
   - Application mode: **Production**
   - Application root: `digital-gyaan/frontend`
   - Application URL: `yourdomain.com`
   - Application startup file: leave default, then set the **Start
     command** to `npm start` in the app settings (Next.js needs `next
     start`, not a plain JS file — see note below).
2. Environment variables (from `frontend/.env.example`):

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api/v1` |
   | `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |
   | `NEXT_PUBLIC_SITE_NAME` | `"Digital Gyaan"` |

3. In the app's terminal:
   ```bash
   npm install
   npm run build      # produces the .next production build
   ```
4. Click **Restart**.
5. Visit `https://yourdomain.com` — homepage should load with live data
   from the API.
6. Visit `https://yourdomain.com/admin/login`, sign in with the
   `SEED_ADMIN_*` credentials from step 4, and publish your first article.

**Note on the frontend startup command:** cPanel's Node.js Selector is
built around Passenger, which by default expects a single entry JS file
(like Express's `dist/server.js`). Next.js's own server is started via
`next start`, not a file. In the app's **Startup File** field, most
cPanel builds accept a small wrapper — create `frontend/server.js`:

```js
const { spawn } = require('child_process');
const port = process.env.PORT || 3000;
spawn('npx', ['next', 'start', '-p', port], { stdio: 'inherit', shell: true });
```

Set the Startup File to `server.js` in that case. If your host's Node.js
Selector instead exposes a "Start command" field directly, put `npm start`
there and skip the wrapper.

## 6. Generating secrets

Run this locally (or in the cPanel terminal) three times to get
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `COOKIE_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Never reuse the same value across these three, and never commit them.

## 7. Database setup summary

No manual schema/migration step is needed — Mongoose creates collections
and indexes automatically on first write. The only setup step is:
```bash
npm run seed
```
run once from the backend app's terminal after environment variables are
set. It is safe to re-run (it skips anything that already exists) — use
it again later if you need to promote another user to `admin`.

## 8. Build & deploy commands (reference)

```bash
# Backend
cd backend
npm install
npm run build       # tsc -> dist/
npm run seed         # first time only
npm start            # node dist/server.js  (cPanel does this via Passenger)

# Frontend
cd frontend
npm install
npm run build         # next build
npm start              # next start        (cPanel does this via Passenger)
```

## 9. Post-launch checklist

- [ ] `https://yourdomain.com` loads and shows real content
- [ ] `https://yourdomain.com/admin/login` works with your seeded admin account
- [ ] Create, edit, and publish a test article end-to-end, including
      uploading a featured image
- [ ] `https://api.yourdomain.com/sitemap.xml`, `/robots.txt`, and
      `/rss.xml` all return correct content
- [ ] SSL certificates are issued for both `yourdomain.com` and
      `api.yourdomain.com` (cPanel → SSL/TLS Status → AutoSSL, or
      Let's Encrypt if offered)
- [ ] Submit `sitemap.xml` in Google Search Console
- [ ] Confirm `CLIENT_URL` on the backend and `NEXT_PUBLIC_API_URL` on the
      frontend point at the real HTTPS domains (CORS will reject requests
      otherwise)
- [ ] Rotate any secret that was ever typed in plaintext into chat, a
      shared doc, or committed to a public repo

## 10. What's deliberately postponed (by your instruction)

Not blocking launch, safe to add after going live:
- Comment moderation UI in `/admin` (comment API + public comment section
  already work; only a dedicated admin moderation screen was deferred)
- Likes/Bookmarks admin visibility (public-facing like/bookmark buttons
  already work)
- Analytics dashboards beyond basic view counts
- Bulk admin tools (bulk publish/delete, media library browser)
- Non-essential UI polish (animations, advanced theming)
