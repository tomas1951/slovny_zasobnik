import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { WordStatus } from "../generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type SourceEntry = { word: string; pos: string | null; tags: string[]; meaning: string };

const TAG_CATALOG = [
  { slug: "archaic", label: "archaické" },
  { slug: "dialect", label: "nárečové" },
  { slug: "historical", label: "historické" },
  { slug: "old", label: "staré" },
  { slug: "regional", label: "regionálne" },
  { slug: "folk", label: "ľudové" },
  { slug: "rare", label: "zriedkavé" },
  { slug: "poetic", label: "básnické" },
];

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics (č/š/ž/ľ/ť/ď/ň/ô etc.)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seedTagCatalog() {
  for (const [order, tag] of TAG_CATALOG.entries()) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { label: tag.label, order },
      create: { slug: tag.slug, label: tag.label, order },
    });
  }
}

async function main() {
  await seedTagCatalog();

  const filePath = path.join(__dirname, "..", "data-pipeline", "output", "archaic_dialect_rare.json");
  const entries: SourceEntry[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const grouped = new Map<string, SourceEntry[]>();
  for (const entry of entries) {
    const meanings = grouped.get(entry.word) ?? [];
    meanings.push(entry);
    grouped.set(entry.word, meanings);
  }

  const slugCounts = new Map<string, number>();
  for (const [wordText, meanings] of grouped) {
    const base = slugify(wordText);
    const n = (slugCounts.get(base) ?? 0) + 1;
    slugCounts.set(base, n);
    const slug = n === 1 ? base : `${base}-${n}`;

    // Tags describe the word as a whole: union every meaning's tags onto
    // the word rather than keeping them per sense.
    const tagSlugs = [...new Set(meanings.flatMap((m) => m.tags))];

    const word = await prisma.word.upsert({
      where: { slug },
      update: { tags: { connect: tagSlugs.map((s) => ({ slug: s })) } },
      create: { slug, word: wordText, tags: { connect: tagSlugs.map((s) => ({ slug: s })) } },
    });

    // Meanings have no stable natural key in the source JSON, so seed-owned
    // meanings (submittedById null) for this word are replaced wholesale on
    // every run rather than upserted individually. Meanings a real user
    // submitted through the app (submittedById set) are never touched here.
    await prisma.wordMeaning.deleteMany({ where: { wordId: word.id, submittedById: null } });
    await prisma.wordMeaning.createMany({
      data: meanings.map((entry) => ({
        wordId: word.id,
        pos: entry.pos,
        meaning: entry.meaning,
        status: WordStatus.PUBLISHED,
      })),
    });
  }
  console.log(`Seeded ${entries.length} meanings across ${grouped.size} words.`);

  if (process.env.SEED_TEST_DATA === "true") {
    await seedTestData();
  }
}

async function seedTestData() {
  const bcrypt = await import("bcryptjs");

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      passwordHash: await bcrypt.hash("admin1234", 12),
      role: "ADMIN",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      name: "Tester",
      email: "user@example.com",
      passwordHash: await bcrypt.hash("test1234", 12),
      role: "USER",
    },
  });

  const pendingWord = await prisma.word.upsert({
    where: { slug: "test-pending-word" },
    update: { tags: { connect: [{ slug: "archaic" }] } },
    create: { slug: "test-pending-word", word: "testovacie-cakajuce", tags: { connect: [{ slug: "archaic" }] } },
  });
  await prisma.wordMeaning.deleteMany({ where: { wordId: pendingWord.id } });
  await prisma.wordMeaning.create({
    data: {
      wordId: pendingWord.id,
      pos: "Podstatné meno",
      meaning: "Testovacie slovo čakajúce na schválenie administrátorom.",
      status: WordStatus.PENDING,
      submittedById: user.id,
    },
  });

  const rejectedWord = await prisma.word.upsert({
    where: { slug: "test-rejected-word" },
    update: { tags: { connect: [{ slug: "dialect" }] } },
    create: { slug: "test-rejected-word", word: "testovacie-zamietnute", tags: { connect: [{ slug: "dialect" }] } },
  });
  await prisma.wordMeaning.deleteMany({ where: { wordId: rejectedWord.id } });
  await prisma.wordMeaning.create({
    data: {
      wordId: rejectedWord.id,
      pos: "Podstatné meno",
      meaning: "Testovacie slovo, ktoré bolo administrátorom zamietnuté.",
      status: WordStatus.REJECTED,
      submittedById: user.id,
      reviewedById: admin.id,
      reviewedAt: new Date(),
      rejectionReason: "Duplicitné so slovom, ktoré už existuje.",
    },
  });

  console.log("Seeded test users:");
  console.log("  admin@example.com / admin1234 (ADMIN)");
  console.log("  user@example.com  / test1234  (USER)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
