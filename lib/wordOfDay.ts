import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { WordStatus } from "@/generated/prisma/enums";

function slovakDateString(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bratislava" }).format(date);
}

function deterministicIndex(dateStr: string, n: number): number {
  const hash = crypto.createHash("sha256").update(dateStr).digest();
  return hash.readUInt32BE(0) % n;
}

const publishedMeaning = { meanings: { some: { status: WordStatus.PUBLISHED } } } as const;

export async function getWordOfTheDay(date: Date = new Date()) {
  const count = await prisma.word.count({ where: publishedMeaning });
  if (count === 0) return null;

  const index = deterministicIndex(slovakDateString(date), count);
  const [word] = await prisma.word.findMany({
    where: publishedMeaning,
    orderBy: { id: "asc" },
    skip: index,
    take: 1,
    include: {
      meanings: { where: { status: WordStatus.PUBLISHED }, orderBy: { createdAt: "asc" } },
      tags: { orderBy: { order: "asc" } },
    },
  });
  return word ?? null;
}
