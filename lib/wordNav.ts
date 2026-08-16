import { prisma } from "@/lib/prisma";
import { WordStatus } from "@/generated/prisma/enums";

const publishedMeaning = { meanings: { some: { status: WordStatus.PUBLISHED } } } as const;

export async function getPublishedWordSlugs(): Promise<string[]> {
  const words = await prisma.word.findMany({
    where: publishedMeaning,
    orderBy: { word: "asc" },
    select: { slug: true },
  });
  return words.map((w) => w.slug);
}

export async function getPublishedWordBySlug(slug: string) {
  return prisma.word.findFirst({
    where: { slug, ...publishedMeaning },
    include: {
      meanings: { where: { status: WordStatus.PUBLISHED }, orderBy: { createdAt: "asc" } },
      tags: { orderBy: { order: "asc" } },
    },
  });
}
