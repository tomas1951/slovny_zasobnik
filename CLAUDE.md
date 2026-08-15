# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Slovný Zásobník — a website that teaches one lesser-used Slovak word per day
(archaic, dialect, historical, old, regional, folk, rare, or poetic
vocabulary no longer in everyday use). Early stage: the word dataset exists;
the site itself has not been built yet.

## Repository structure

- `data-pipeline/parse_wiktionary.py` — the only code in the repo. Parses a
  Slovak Wiktionary XML dump and extracts entries tagged with one of the
  target categories.
- `data-pipeline/raw/` — gitignored. Holds the downloaded XML dump
  (`skwiktionary-latest-pages-articles.xml(.bz2)`); not committed.
- `data-pipeline/output/archaic_dialect_rare.json` — the generated dataset,
  committed to the repo. Each entry: `{word, pos, tags, meaning}`.

## Regenerating the dataset

```bash
cd data-pipeline
curl -o raw/skwiktionary-latest-pages-articles.xml.bz2 \
  https://dumps.wikimedia.org/skwiktionary/latest/skwiktionary-latest-pages-articles.xml.bz2
bzip2 -dk raw/skwiktionary-latest-pages-articles.xml.bz2
python parse_wiktionary.py
```

No build system, package manager, linter, or test suite is set up yet —
`parse_wiktionary.py` has no external dependencies beyond the standard
library.

## How the parser works (`parse_wiktionary.py`)

1. Streams the MediaWiki XML dump with `ET.iterparse`, clearing each `page`
   element after processing to keep memory bounded (the dump is large).
2. Skips non-article pages (namespace != "0") and redirects.
3. For each page, isolates the `== Slovenčina ==` section of the wikitext
   (`extract_slovak_section`) — only Slovak-language senses are extracted,
   not translations/foreign sections.
4. Within that section, scans definition lines (`# ...`) for a
   `{{Príznak(y)|...}}` template and matches its tag codes against
   `TARGET_TAGS` (e.g. `zast.` → `archaic`, `nár.` → `dialect`). Lines with
   no matching tag are dropped.
5. `clean_meaning` strips `<ref>` tags, `{{Význam|...}}` wrappers, wikilinks,
   and any remaining templates to leave plain text.
6. `find_pos` walks backward from the matched line to the nearest preceding
   part-of-speech header (`POS_HEADERS`, e.g. "Podstatné meno") to attach a
   POS to the entry.
7. Writes all matched `{word, pos, tags, meaning}` entries as JSON.

When editing tag handling or meaning cleanup, `TARGET_TAGS` and the regexes
near the top of the file (`TAG_TEMPLATE_RE`, `VYZNAM_RE`, `WIKILINK_RE`,
`TEMPLATE_STRIP_RE`) are the places to change — they encode the Wiktionary
wikitext conventions the parser depends on.

## Data license

Source: Slovak Wiktionary dumps (`https://dumps.wikimedia.org/skwiktionary/`),
licensed CC BY-SA 4.0 — free for commercial use, but redistribution of the
dataset itself requires attribution and share-alike.

## Known limitation

Slovak Wiktionary's coverage of this vocabulary is shallow — the current
dataset (176 words / 227 tagged senses) is roughly six months of daily
content, not a long-term supply. Expanding it (e.g. licensing KSSJ/SNK data
from the Slovak Academy of Sciences, or human-verified supplementary
entries) is a known future task, not started.
