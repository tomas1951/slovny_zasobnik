import { prisma } from "@/lib/prisma";
import { WordStatus } from "@/generated/prisma/enums";
import { WordCard } from "@/components/WordCard";
import { TagFilter } from "@/components/TagFilter";
import { getTagCatalog } from "@/lib/tagCatalog";
import { auth } from "@/lib/auth";

export default async function WordsPage({ searchParams }: PageProps<"/words">) {
  const params = await searchParams;
  const tagsParam = params.tags;
  const selectedTags = (Array.isArray(tagsParam) ? tagsParam[0] : tagsParam)
    ?.split(",")
    .filter(Boolean) ?? [];

  const [words, session, tagCatalog] = await Promise.all([
    prisma.word.findMany({
      where: {
        meanings: { some: { status: WordStatus.PUBLISHED } },
        ...(selectedTags.length > 0 ? { tags: { some: { slug: { in: selectedTags } } } } : {}),
      },
      orderBy: { word: "asc" },
      include: {
        meanings: { where: { status: WordStatus.PUBLISHED }, orderBy: { createdAt: "asc" } },
        tags: { orderBy: { order: "asc" } },
      },
    }),
    auth(),
    getTagCatalog(),
  ]);
  const isAdmin = session?.user?.role === "ADMIN";
  const meaningCount = words.reduce((sum, w) => sum + w.meanings.length, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">
        Slová ({words.length}, {meaningCount} významov)
      </h1>
      <TagFilter selected={selectedTags} catalog={tagCatalog} />
      <div className="flex flex-col gap-4">
        {words.map((word) => (
          <WordCard
            key={word.id}
            wordId={word.id}
            word={word.word}
            slug={word.slug}
            tags={word.tags}
            meanings={word.meanings}
            isAdmin={isAdmin}
            tagCatalog={tagCatalog}
          />
        ))}
        {words.length === 0 && (
          <p className="text-foreground/60">Žiadne slová nezodpovedajú filtru.</p>
        )}
      </div>
    </div>
  );
}
