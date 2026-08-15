# Slovný Zásobník

A website that teaches one lesser-used Slovak word per day — archaic, dialect,
historical, rare, or folk vocabulary that isn't part of everyday active
vocabulary anymore.

## Status

Early stage. The word dataset is built; the site itself hasn't been built yet.

## Dataset

`data-pipeline/` extracts Slovak words tagged as archaic, dialect, historical,
old, regional, folk, rare, or poetic from the [Slovak Wiktionary](https://sk.wiktionary.org)
XML dump.

- Source: `https://dumps.wikimedia.org/skwiktionary/`
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) —
  free for commercial use, requires attribution and share-alike on redistribution
  of the dataset itself
- Current output: `data-pipeline/output/archaic_dialect_rare.json` —
  176 unique words, 227 tagged senses

To regenerate the dataset:

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
entries) is a future task, not yet started.
