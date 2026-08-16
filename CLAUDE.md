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
SEED_TEST_DATA=true npx prisma db seed  # ...plus test admin/user accounts (see below)
npm run dev                   # start the app
npx tsc --noEmit              # typecheck (run `npx next typegen` first if routes changed)
npm run lint
npm run build
```

`.env` holds `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
`AUTH_GOOGLE_SECRET` (see `.env.example`). No admin UI exists to promote the
first admin — after registering, run
`UPDATE users SET role='ADMIN' WHERE email='...'` directly against the DB.

## Deployment

Live in production at **www.slovnyzasobnik.sk**, hosted on **Vercel**
(custom domain via Websupport.sk DNS: `www` CNAME → `cname.vercel-dns.com`,
apex A record → `76.76.21.21`) with **Neon** (serverless Postgres) as the
production database. `package.json`'s `postinstall: prisma generate` exists
specifically so Vercel's build generates the gitignored
`generated/prisma/` client — without it the build fails on
`Cannot find module '@/generated/prisma/client'`. Vercel Analytics is
wired in via `<Analytics />` in `app/layout.tsx`.

Required env vars in Vercel (Project Settings → Environment Variables):
`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
**Env var changes don't apply to existing deployments** — always redeploy
after adding/changing one. A missing `AUTH_SECRET` in particular breaks
*all* auth (Credentials and Google both) with next-auth's generic "There
was a problem with the server configuration" error — check that first if
auth breaks in prod.

**Neon migration gotcha**: `prisma migrate deploy`/`migrate reset` do not
reliably apply a multi-statement migration.sql to Neon with the same
single-transaction atomicity local Postgres gives you — a migration can
fail partway through with earlier statements in the *same file* already
durably committed (constraints dropped, rows deleted), even though the
migration is recorded as failed and blocks further deploys (P3009). If a
migration ever fails against Neon, don't assume a clean rollback happened —
check actual table/constraint state before deciding how to recover
(`prisma migrate resolve --rolled-back <name>` is only safe once you've
confirmed that). Prefer writing migrations that touch existing
tables/constraints defensively (`IF EXISTS`/`IF NOT EXISTS` on drops and
creates) so they're safe to retry regardless of partial application.

## Architecture

- `prisma/schema.prisma` — `User`/`Account`/`Session`/`VerificationToken`
  (Auth.js adapter models) + `Word`/`WordMeaning`/`Tag`/`WordReport`. A word
  with multiple senses (e.g. "porta") is **one `Word` row** (headword text +
  unique `slug`) with **many `WordMeaning` rows** under it. The split between
  the two follows what's shared across every sense of a word vs. what's
  specific to one: `Word` carries the headword text/slug, `Tag`s (many-to-many
  — see below), and **both** rating mechanisms — the "did you know this word"
  poll (`knewCount`/`didntKnowCount`) and the usefulness rating
  (`usefulCount`/`notUsefulCount`) are questions about the word as a whole,
  not one sense, so both live on `Word`; `WordMeaning` carries only `pos`, the
  `meaning` text, moderation `status`, and submitter/reviewer. There's no
  per-user `Rating` model — both counter pairs are anonymous aggregates,
  incremented/decremented via client-side localStorage tracking of the user's
  previous choice rather than a unique-per-user DB row. **Tags describe the
  word as a whole** — `Tag`
  is a normalized model (`slug`/`label`/`order`) in an implicit many-to-many
  with `Word`, so growing the tag vocabulary is a DB insert (see
  `prisma/seed.ts`'s `TAG_CATALOG`), not a code change. When a submission's
  chosen tags land on a `Word` that already has some (either because it's an
  existing word or the seed script found the same headword tagged differently
  across senses), they're unioned on, never scoped to one meaning.
  `lib/tagCatalog.ts#getTagCatalog()` is the read path (server-only, ordered
  by `Tag.order`); client components that need the tag list (forms, filters)
  receive it as a prop from a Server Component parent rather than importing a
  static list. `WordMeaning.status` is `PENDING`/`PUBLISHED`/`REJECTED`; only
  words with at least one `PUBLISHED` meaning are ever shown publicly or
  eligible for word-of-day, and only the `PUBLISHED` meanings within them are
  rendered. `WordReport` is one-to-many on `Word` (not `WordMeaning`) —
  flagging/proposing a change is a word-level action: it can only propose a
  new tag set (`proposedTags`) plus a freeform `message`, not edit a specific
  sense's definition text (that's admin-only, via `EditWordButton`).
- `components/WordCard.tsx` renders a `Word` + its `meanings[]` as one
  card: the headword once, its `Tag`s once (with `EditWordTagsButton` for
  admins), then every meaning numbered underneath — just `pos` + text + the
  admin `EditWordButton`, nothing rating-related lives per meaning anymore —
  then one word-level extra section (`renderWordExtra`, caller-supplied):
  `WordPoll`, `UsefulnessWidget`, and `ReportIssueButton` all render **once
  per word** (see `app/page.tsx`, `app/words/page.tsx`,
  `app/words/[slug]/page.tsx`). There's currently no UI to rename a `Word`'s
  headword or slug (only a direct DB edit), since that's shared across every
  meaning under it.
- `lib/wordOfDay.ts` — the daily word is **stateless and deterministic**: a
  SHA-256 hash of today's date (`Europe/Bratislava` timezone) is used as an
  index into all `Word`s that have ≥1 `PUBLISHED` meaning, ordered by `id`.
  No "daily selection" table exists; the same word is guaranteed for
  everyone on a given day without persisting anything. `app/page.tsx` caches
  this for an hour via `export const revalidate = 3600`.
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
  `usefulness.ts`/`polls.ts`: increment/decrement a `Word`'s usefulness/poll
  counters based on the caller's previous choice (read from `localStorage`
  client-side; only `usefulness.ts` requires auth), `reports.ts`: create a `WordReport` against
  a `Word` with tags validated against the `Tag` table, `words.ts`: user
  submissions — if the submitted headword text matches an existing `Word`,
  attaches a new `PENDING` `WordMeaning` to it instead of creating a duplicate
  `Word`, and unions the submission's chosen tags onto that `Word` either way,
  `admin.ts`: approve/reject a `WordMeaning`, `updateWordTags` to `set` a
  `Word`'s tags, `applyWordReport` applies a report's `proposedTags` onto its
  `Word`). No REST API layer exists beyond the Auth.js catch-all route
  (`app/api/auth/[...nextauth]/route.ts`).
- `prisma/seed.ts` — imports `data-pipeline/output/archaic_dialect_rare.json`
  (each entry = one sense), upserts the `Tag` catalog first, then **groups
  entries by exact headword text** into one `Word` per distinct spelling
  with a `WordMeaning` per entry, all `PUBLISHED`, no submitter — each
  entry's original tags are unioned onto the `Word` (`connect`, so a
  reseed never drops a tag added via the app in the meantime). Re-running it
  replaces only seed-owned meanings (`submittedById IS NULL`) per word —
  meanings a real user submitted through the app are never touched by a
  reseed. Gated behind
  `SEED_TEST_DATA=true`, it also upserts a hardcoded test admin
  (`admin@example.com` / `admin1234`) and test user, plus two dummy
  PENDING/REJECTED words — convenient for local dev, but since the
  credentials are public in this file, **never set that env var when
  seeding a real/shared database.**

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
