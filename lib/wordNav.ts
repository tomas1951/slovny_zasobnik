import { prisma } from "@/lib/prisma";
import { WordStatus } from "@/generated/prisma/enums";

export async function getPublishedWordSlugs(): Promise<string[]> {
  const words = await prisma.word.findMany({
    where: { status: WordStatus.PUBLISHED },
    orderBy: { word: "asc" },
    select: { slug: true },
  });
  return words.map((w) => w.slug);
}

export async function getPublishedWordBySlug(slug: string) {
  return prisma.word.findFirst({ where: { slug, status: WordStatus.PUBLISHED } });
}
