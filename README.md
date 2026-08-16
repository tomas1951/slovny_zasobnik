# Slovný Zásobník

A website that teaches one lesser-used Slovak word per day — archaic, dialect,
historical, rare, or folk vocabulary that isn't part of everyday active
vocabulary anymore.

## Stack

TypeScript, Next.js (App Router), PostgreSQL, Prisma ORM, Auth.js.

## Getting started

Requires Node.js 20.9+ and Docker.

```bash
docker compose up -d          # start Postgres
cp .env.example .env          # fill in AUTH_SECRET / Google OAuth credentials
npm install
npx prisma migrate dev        # create the schema
npx prisma db seed            # load the word dataset
npm run dev
```

App runs at `http://localhost:3000`.

## Features

- **Word of the day** — one fixed word shown to every visitor per calendar
  day, plus a "Naučiť sa ďalšie slovo" button to browse a random next word
- **Word list** (`/words`) — browse all published words, filterable by tag
- **Accounts** — email/password or Google sign-in
- **Usefulness voting & polls** — anyone can mark a word useful/not useful
  (login required) or vote whether they already knew it (anonymous), with
  aggregate counts shown per word
- **Word reports** — flag a word entry as wrong or in need of a fix
- **Contributions** — logged-in users can submit new words; an admin
  approves or rejects submissions at `/admin/submissions` before they go
  public

See `CLAUDE.md` for architecture details.

## Dataset

The initial word set comes from `data-pipeline/`, a one-off script that
extracted Slovak words tagged as archaic, dialect, historical, old, regional,
folk, rare, or poetic from the [Slovak Wiktionary](https://sk.wiktionary.org)
XML dump. Its output has already been imported into the database via the
Prisma seed script — the pipeline isn't part of the running app.

- Source: `https://dumps.wikimedia.org/skwiktionary/`
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) —
  free for commercial use, requires attribution and share-alike on redistribution
  of the dataset itself
- Output: `data-pipeline/output/archaic_dialect_rare.json` —
  176 unique words, 227 tagged senses

To regenerate the dataset (not needed for normal development):

```bash
cd data-pipeline
curl -o raw/skwiktionary-latest-pages-articles.xml.bz2 \
  https://dumps.wikimedia.org/skwiktionary/latest/skwiktionary-latest-pages-articles.xml.bz2
bzip2 -dk raw/skwiktionary-latest-pages-articles.xml.bz2
python parse_wiktionary.py
```

### Known limitation

Slovak Wiktionary's coverage of archaic/dialect/rare vocabulary is real but
shallow — 176 words is roughly six months of daily content, not a
long-term supply. Expanding the dataset (e.g. licensing terms from the
Slovak Academy of Sciences for KSSJ/SNK, or human-verified supplementary
entries, or user contributions via `/contribute`) is a future task.
