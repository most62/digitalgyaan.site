# Digital Gyaan — Production Blogging Platform

A ground-up rebuild of digitalgyaan.site (currently WordPress) as a custom
Next.js 15 + Express/MongoDB application.

## Monorepo layout

```
digital-gyaan/
├── backend/     Express + TypeScript + MongoDB API
└── frontend/    Next.js 15 App Router + TypeScript + Tailwind
```

## Build status (this is being built in phases in-conversation)

- [x] **Phase 0 — Skeleton**: repo structure, config, security middleware,
      DB connection, logging, error handling, User model, health check,
      Next.js app shell with theme provider and a real (non-mocked) homepage
      data fetch.
- [x] **Phase 1 — Backend foundation**: full data models (Post, Category, Tag,
      Comment, Like, Bookmark, View, Subscriber, Settings), JWT auth with
      refresh-token rotation, RBAC middleware.
- [x] **Phase 2 — Content API**: posts/categories/tags CRUD with
      search/filter/sort/pagination, nested comments with moderation,
      likes/bookmarks/views (transaction-safe counters), Cloudinary uploads
      (magic-byte validated), newsletter double opt-in, sitemap.xml,
      robots.txt, rss.xml, scheduled-publish cron job. Full docs in
      `docs/API.md`.
- [x] **Phase 3 — Frontend foundation**: design system (palette/type/tokens),
      Header with trending ticker + mobile nav, Footer with newsletter form,
      homepage (hero/featured/latest/category chips), category & tag listing
      pages, instant search with autocomplete, pagination, sort control —
      all wired to the live backend API, zero mock data.
- [x] **Phase 4 — Article system**: full article page (SSR content, auto TOC,
      syntax highlighting, FAQ + JSON-LD schema, OpenGraph/Twitter meta),
      like/bookmark/view, share, prev/next, related posts, author pages,
      fully nested comments (reply/edit/delete/like), auth-aware UI,
      loading/error/404 states across every route.
- [ ] Phase 5 — Search, dark mode polish, user profiles, newsletter,
      static pages (About/Privacy/Terms/Contact), 404/error pages.
- [ ] Phase 6 — Admin panel: dashboard, TipTap editor, content management,
      moderation, analytics, settings.
- [ ] Phase 7 — SEO (schema.org/JSON-LD), Docker, deployment configs,
      install/deploy guides.

## Quick start (once dependencies are installed)

### Backend
```bash
cd backend
cp .env.example .env   # fill in MongoDB Atlas URI, JWT secrets, Cloudinary, SMTP
npm install
npm run dev             # http://localhost:5000/api/v1/health
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev             # http://localhost:3000
```

## Notes
- No mock data anywhere: the homepage genuinely calls the backend API and
  shows an honest empty state until the Posts API (Phase 2) exists.
- Content model is designed around the current site's structure: categories
  (Android Apps, Gadgets & Reviews, OTT & Streaming, Tech News, Upcoming
  Mobiles), single/multi-author posts, nested comments.
