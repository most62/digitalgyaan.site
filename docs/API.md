# Digital Gyaan API Documentation

Base URL: `http://localhost:5000/api/v1` (dev) — all responses are JSON in the
shape `{ success: boolean, data?, message?, meta? }`. Errors follow
`{ success: false, status: "fail"|"error", message }`.

Auth: send `Authorization: Bearer <accessToken>` for protected routes. The
refresh token is delivered as an httpOnly signed cookie automatically — the
frontend never touches it directly.

## Auth — `/auth`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Create account, returns access token + sets refresh cookie |
| POST | `/login` | Public | Login |
| POST | `/refresh` | Public (cookie) | Rotates refresh token, returns new access token |
| POST | `/logout` | Public | Revokes the current refresh token |
| GET | `/me` | Authenticated | Current user profile |
| POST | `/forgot-password` | Public | Sends password reset email |
| PATCH | `/reset-password/:token` | Public | Resets password with emailed token |
| PATCH | `/update-password` | Authenticated | Change password (requires current password) |

## Categories — `/categories`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List all categories with live post counts |
| GET | `/:slug` | Public | Single category |
| POST | `/` | Admin, Editor | Create category |
| PATCH | `/:id` | Admin, Editor | Update category |
| DELETE | `/:id` | Admin | Delete (blocked if posts reference it) |

## Tags — `/tags`
Same shape as Categories.

## Posts — `/posts`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List published posts. Query: `category`, `tag`, `author`, `featured=true`, `trending=true`, `search`, `sort` (`newest`\|`oldest`\|`trending`\|`most-viewed`\|`most-liked`), `page`, `limit` (max 50), `fields` |
| GET | `/trending` | Public | Top 6 by views |
| GET | `/featured` | Public | Top 6 featured |
| GET | `/:slug` | Public | Full post + relatedPosts + prevPost/nextPost |
| GET | `/admin` | Admin/Editor/Author | Dashboard listing (authors see only their own; supports `status` filter) |
| GET | `/admin/:id` | Admin/Editor/Author (owner) | Fetch any post by id for editing |
| POST | `/` | Admin/Editor/Author | Create post |
| PATCH | `/:id` | Admin/Editor/Author (owner) | Update post |
| DELETE | `/:id` | Admin/Editor/Author (owner) | Delete post |
| POST | `/:id/like` | Authenticated | Toggle like |
| POST | `/:id/bookmark` | Authenticated | Toggle bookmark |
| POST | `/:id/view` | Public (optional auth) | Records a deduplicated view (1/viewer/day) |

`isFeatured`/`isTrending` can only be set by Admin/Editor even on a post
authored by an Author role.

## Comments
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/posts/:postId/comments` | Public | Approved nested comment tree |
| POST | `/posts/:postId/comments` | Authenticated | Create comment or reply (`parent` optional) |
| PATCH | `/comments/:id` | Owner | Edit own comment |
| DELETE | `/comments/:id` | Owner, Admin, Editor | Delete (soft-deletes if it has replies) |
| POST | `/comments/:id/like` | Authenticated | Toggle like |
| GET | `/comments/pending` | Admin, Editor | Moderation queue |
| PATCH | `/comments/:id/moderate` | Admin, Editor | Body: `{ action: "approve"\|"spam" }` |

## Current user — `/me`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/bookmarks` | Authenticated | List saved posts |

## Newsletter — `/newsletter`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/subscribe` | Public | Double opt-in, sends confirmation email |
| GET | `/confirm/:token` | Public | Confirms subscription, redirects to frontend |
| GET | `/unsubscribe/:token` | Public | Unsubscribes, redirects to frontend |
| GET | `/subscribers` | Admin, Editor | Paginated list of confirmed subscribers |

## Uploads — `/uploads`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/image` | Admin/Editor/Author | multipart field `image`, optional `folder` |
| POST | `/images` | Admin/Editor/Author | multipart field `images` (max 10) |
| DELETE | `/image` | Admin/Editor/Author | Body: `{ publicId }` or `{ url }` |

Images are validated by both declared mimetype and actual file signature
(magic bytes), capped at 5MB, and stored under `digital-gyaan/<folder>` on
Cloudinary with automatic format/quality optimization.

## Feeds (served at domain root, not `/api/v1`)
| Method | Path | Description |
|---|---|---|
| GET | `/sitemap.xml` | All published posts + categories + static pages |
| GET | `/robots.txt` | Points crawlers to the sitemap |
| GET | `/rss.xml` | Latest 30 published posts, RSS 2.0 |

## Roles
`admin` > `editor` > `author` > `user`. Admin/editor manage all content;
authors manage only their own posts; users can comment, like, bookmark,
and subscribe.
