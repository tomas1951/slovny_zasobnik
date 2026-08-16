export const TAG_LABELS: Record<string, string> = {
  archaic: "archaické",
  dialect: "nárečové",
  historical: "historické",
  old: "staré",
  regional: "regionálne",
  folk: "ľudové",
  rare: "zriedkavé",
  poetic: "básnické",
};

export const ALL_TAGS = Object.keys(TAG_LABELS);

export const POS_OPTIONS = [
  "Podstatné meno",
  "Prídavné meno",
  "Sloveso",
  "Zámeno",
  "Číslovka",
  "Predložka",
  "Spojka",
  "Citoslovce",
  "Častica",
  "Príslovka",
] as const;
