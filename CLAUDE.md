# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Slovný Zásobník — a website that teaches one lesser-used Slovak word per day
(archaic, dialect, historical, old, regional, folk, rare, or poetic
vocabulary no longer in everyday use). TypeScript/Next.js (App Router) app
at the repo root, backed by PostgreSQL via Prisma, with Auth.js accounts,
usefulness/poll voting, word reporting, and a user-contribution/admin-approval
flow.

## Stack versions — read before assuming API shape

This repo runs **Next.js 16**, **Prisma 7**, and **next-auth v5 (beta)** —
all recent major versions with real breaking changes from what training data
usually assumes. Before writing Next.js or Prisma code here, check
`node_modules/next/dist/docs/` (bundled, version-matched docs) and the notes
below rather than relying on remembered conventions. Specifically:

- **Proxy, not Middleware**: the root-level request-interception file is
  `proxy.ts` (exporting a default function), not `middleware.ts` — Next.js
  16 renamed and deprecated the old convention.
- **Async `params`/`searchParams`**: fully async in v16 (no sync fallback).
  Page components use the generated `PageProps<"route">` /
  `LayoutProps<"route">` helper types (see `app/words/[slug]/page.tsx` or
  `app/layout.tsx`) — run `npx next typegen` after adding/renaming routes so
  these types exist, or `tsc --noEmit` will fail on routes it doesn't know
  about yet.
- **Prisma 7 requires a driver adapter** — there's no bare
  `new PrismaClient()`. See `lib/prisma.ts`: it wires `@prisma/adapter-pg`
  (`pg` package) explicitly. The generated client lives at
  `generated/prisma/` (repo root, gitignored, regenerated via
  `npx prisma generate`), imported as `@/generated/prisma/client` /
  `@/generated/prisma/enums` — not `@prisma/client`.
- **Prisma config lives in `prisma.config.ts`**, not `package.json`. Notably
  the seed command is `migrations.seed` in that file (currently
  `"tsx prisma/seed.ts"`), not a `package.json#prisma.seed` field.
- **next-auth v5 is still on the `beta` dist-tag** upstream — check
  `npm view next-auth dist-tags` before assuming it graduated to `latest`.

## Commands

```bash
docker compose up -d          # start Postgres (repo-root docker-compose.yml)
npx prisma migrate dev        # apply schema
npx prisma db seed            # load data-pipeline's dataset into Word rows
npm run dev                   # start the app
npx tsc --noEmit              # typecheck (run `npx next typegen` first if routes changed)
npm run lint
npm run build
```

`.env` holds `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
`AUTH_GOOGLE_SECRET` (see `.env.example`). No admin UI exists to promote the
first admin — after registering, run
`UPDATE users SET role='ADMIN' WHERE email='...'` directly against the DB.

## Architecture

- `prisma/schema.prisma` — `User`/`Account`/`Session`/`VerificationToken`
  (Auth.js adapter models) + `Word` + `WordReport`. `Word.tags` is a scalar
  `String[]` (fixed 8-value vocabulary — see `lib/tags.ts`), not a
  normalized join table. `Word.status` is `PENDING`/`PUBLISHED`/`REJECTED`;
  only `PUBLISHED` words are ever shown publicly or eligible for word-of-day.
  There's no per-user `Rating` model — usefulness voting
  (`usefulCount`/`notUsefulCount`) and the "did you know this word" poll
  (`knewCount`/`didntKnowCount`) are anonymous aggregate counters directly
  on `Word`, incremented/decremented via client-side localStorage tracking
  of the user's previous choice rather than a unique-per-user DB row.
  `WordReport` is a separate one-to-many model for flagging bad entries
  (optional `reporterId`, freeform `message`).
- `lib/wordOfDay.ts` — the daily word is **stateless and deterministic**: a
  SHA-256 hash of today's date (`Europe/Bratislava` timezone) is used as an
  index into all `PUBLISHED` words ordered by `id`. No "daily selection"
  table exists; the same word is guaranteed for everyone on a given day
  without persisting anything. `app/page.tsx` caches this for an hour via
  `export const revalidate = 3600`.
- `lib/auth.ts` — Credentials (bcrypt-hashed passwords) + Google providers
  via `PrismaAdapter`, **JWT session strategy** (required — Credentials
  isn't compatible with Auth.js database sessions). Role (`USER`/`ADMIN`)
  is threaded through the JWT via the `jwt`/`session` callbacks; see
  `types/next-auth.d.ts` for the resulting type augmentation.
- `proxy.ts` — route-level gating only (`/contribute` requires login,
  `/admin/*` requires `ADMIN`). Every `lib/actions/*` Server Action
  re-checks `auth()`/role itself regardless, since Server Actions are
  directly callable endpoints independent of proxy matchers.
- `lib/actions/` — all mutations (`auth.ts`: register/sign-in/sign-out,
  `usefulness.ts`/`polls.ts`: increment/decrement `Word` counters based on
  the caller's previous choice (read from `localStorage` client-side; only
  `usefulness.ts` requires auth), `reports.ts`: create a `WordReport`,
  `words.ts`: user submissions → `PENDING`, `admin.ts`: approve/reject). No
  REST API layer exists beyond the Auth.js catch-all route
  (`app/api/auth/[...nextauth]/route.ts`).
- `prisma/seed.ts` — imports `data-pipeline/output/archaic_dialect_rare.json`
  (each entry = one sense/row, not merged by lexical word) as `PUBLISHED`
  words with no submitter. Idempotent via `upsert` on `slug`.

## Dataset origin

`data-pipeline/` is a **one-off tool**, not part of the running app — it
already produced `data-pipeline/output/archaic_dialect_rare.json` (176
unique words, 227 tagged senses), which the seed script imports. It only
needs to be re-run if the dataset itself needs regenerating from a fresh
Wiktionary dump:

```bash
cd data-pipeline
curl -o raw/skwiktionary-latest-pages-articles.xml.bz2 \
  https://dumps.wikimedia.org/skwiktionary/latest/skwiktionary-latest-pages-articles.xml.bz2
bzip2 -dk raw/skwiktionary-latest-pages-articles.xml.bz2
python parse_wiktionary.py
```

See the parser's own docstrings for extraction details (tag-code mapping,
`{{Príznak}}` template parsing, POS-header backtracking). Source data is
Slovak Wiktionary (CC BY-SA 4.0) — redistribution of the dataset itself
requires attribution and share-alike.

## Known limitation

Slovak Wiktionary's coverage of this vocabulary is shallow — 176 seeded
words is roughly six months of daily content. Growing it now relies on the
`/contribute` → admin-approval flow rather than the pipeline; licensing
KSSJ/SNK data from the Slovak Academy of Sciences remains a possible future
source, not started.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
