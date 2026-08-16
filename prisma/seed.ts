import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { WordStatus } from "../generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type SourceEntry = { word: string; pos: string | null; tags: string[]; meaning: string };

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics (č/š/ž/ľ/ť/ď/ň/ô etc.)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const filePath = path.join(__dirname, "..", "data-pipeline", "output", "archaic_dialect_rare.json");
  const entries: SourceEntry[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const slugCounts = new Map<string, number>();
  for (const entry of entries) {
    const base = slugify(entry.word);
    const n = (slugCounts.get(base) ?? 0) + 1;
    slugCounts.set(base, n);
    const slug = n === 1 ? base : `${base}-${n}`;

    await prisma.word.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        word: entry.word,
        pos: entry.pos,
        tags: entry.tags,
        meaning: entry.meaning,
        status: WordStatus.PUBLISHED,
      },
    });
  }
  console.log(`Seeded ${entries.length} words.`);

  if (process.env.NODE_ENV !== "production") {
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

  await prisma.word.upsert({
    where: { slug: "test-pending-word" },
    update: {},
    create: {
      slug: "test-pending-word",
      word: "testovacie-cakajuce",
      pos: "Podstatné meno",
      tags: ["archaic"],
      meaning: "Testovacie slovo čakajúce na schválenie administrátorom.",
      status: WordStatus.PENDING,
      submittedById: user.id,
    },
  });

  await prisma.word.upsert({
    where: { slug: "test-rejected-word" },
    update: {},
    create: {
      slug: "test-rejected-word",
      word: "testovacie-zamietnute",
      pos: "Podstatné meno",
      tags: ["dialect"],
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
