"""
Parse the Slovak Wiktionary XML dump and extract Slovak-language entries
tagged as archaic / dialect / rare / historical / old / regional / folk / poetic.

Source: https://dumps.wikimedia.org/skwiktionary/ (CC BY-SA 4.0)
"""
import re
import xml.etree.ElementTree as ET
import json
from pathlib import Path

RAW = Path(__file__).parent / "raw" / "skwiktionary-latest-pages-articles.xml"
OUT = Path(__file__).parent / "output"
OUT.mkdir(exist_ok=True)

# Tag codes we care about, mapped to a normalized English-free label.
TARGET_TAGS = {
    "zast.": "archaic",
    "star.": "old",
    "hist.": "historical",
    "nár.": "dialect",
    "reg.": "regional",
    "ľud.": "folk",
    "zr.": "rare",
    "zried.": "rare",
    "bás.": "poetic",
}

NS = {"mw": "http://www.mediawiki.org/xml/export-0.11/"}

TAG_TEMPLATE_RE = re.compile(r"\{\{Príznak(?:y\|sk)?2?\|([^}]*)\}\}")
VYZNAM_RE = re.compile(r"\{\{Význam\|(.*?)\}\}")
WIKILINK_RE = re.compile(r"\[\[(?:[^\|\]]*\|)?([^\]]+)\]\]")
TEMPLATE_STRIP_RE = re.compile(r"\{\{[^}]*\}\}")

POS_HEADERS = [
    "Podstatné meno", "Sloveso", "Prídavné meno", "Príslovka",
    "Zámeno", "Číslovka", "Predložka", "Spojka", "Citoslovce", "Častica",
]


REF_RE = re.compile(r"<ref[^>]*>.*?</ref>|<ref[^>]*/>", re.DOTALL)


def clean_meaning(text: str) -> str:
    text = REF_RE.sub("", text)
    text = VYZNAM_RE.sub(r"\1", text)
    text = TAG_TEMPLATE_RE.sub("", text)
    text = WIKILINK_RE.sub(r"\1", text)
    text = TEMPLATE_STRIP_RE.sub("", text)
    text = text.replace("''", "").strip(" #*")
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip(" ,")


def find_pos(lines, idx):
    for j in range(idx, -1, -1):
        stripped = lines[j].strip().strip("=").strip()
        stripped = re.sub(r"\s*\(\d+\)\s*$", "", stripped)  # strip homonym suffix e.g. "(1)"
        if stripped in POS_HEADERS:
            return stripped
    return None


def extract_slovak_section(wikitext: str) -> str | None:
    m = re.search(r"^== Slovenčina ==\s*$", wikitext, re.MULTILINE)
    if not m:
        return None
    start = m.end()
    m2 = re.search(r"^== [^=]+ ==\s*$", wikitext[start:], re.MULTILINE)
    end = start + m2.start() if m2 else len(wikitext)
    return wikitext[start:end]


def parse_page(title: str, text: str):
    section = extract_slovak_section(text)
    if not section:
        return []

    section = REF_RE.sub("", section)  # refs can span lines; strip before splitting
    lines = section.split("\n")
    results = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped.startswith("# ") and stripped != "#":
            continue
        if "Príznak" not in line:
            continue
        tag_match = TAG_TEMPLATE_RE.search(line)
        if not tag_match:
            continue
        raw_tags = [t.strip() for t in tag_match.group(1).split("|") if t.strip()]
        matched = [TARGET_TAGS[t] for t in raw_tags if t in TARGET_TAGS]
        if not matched:
            continue

        meaning = clean_meaning(line)
        if not meaning:
            continue

        pos = find_pos(lines, i)
        results.append({
            "word": title,
            "pos": pos,
            "tags": sorted(set(matched)),
            "meaning": meaning,
        })
    return results


def main():
    context = ET.iterparse(RAW, events=("end",))
    all_entries = []
    page_count = 0

    for event, elem in context:
        tag = elem.tag.split("}")[-1]
        if tag != "page":
            continue
        page_count += 1

        title_el = elem.find("{http://www.mediawiki.org/xml/export-0.11/}title")
        ns_el = elem.find("{http://www.mediawiki.org/xml/export-0.11/}ns")
        redirect_el = elem.find("{http://www.mediawiki.org/xml/export-0.11/}redirect")
        revision_el = elem.find("{http://www.mediawiki.org/xml/export-0.11/}revision")

        if title_el is None or ns_el is None or ns_el.text != "0" or redirect_el is not None:
            elem.clear()
            continue

        title = title_el.text
        text_el = revision_el.find("{http://www.mediawiki.org/xml/export-0.11/}text") if revision_el is not None else None
        text = text_el.text if text_el is not None and text_el.text else ""

        entries = parse_page(title, text)
        all_entries.extend(entries)

        elem.clear()

    print(f"Pages scanned: {page_count}")
    print(f"Tagged senses found: {len(all_entries)}")
    unique_words = sorted(set(e["word"] for e in all_entries))
    print(f"Unique words: {len(unique_words)}")

    with open(OUT / "archaic_dialect_rare.json", "w", encoding="utf-8") as f:
        json.dump(all_entries, f, ensure_ascii=False, indent=2)

    print(f"Written to {OUT / 'archaic_dialect_rare.json'}")


if __name__ == "__main__":
    main()
