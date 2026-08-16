import { prisma } from "@/lib/prisma";
import { WordStatus } from "@/generated/prisma/enums";
import { WordCard } from "@/components/WordCard";
import { TagFilter } from "@/components/TagFilter";
import { auth } from "@/lib/auth";

export default async function WordsPage({ searchParams }: PageProps<"/words">) {
  const params = await searchParams;
  const tagsParam = params.tags;
  const selectedTags = (Array.isArray(tagsParam) ? tagsParam[0] : tagsParam)
    ?.split(",")
    .filter(Boolean) ?? [];

  const [words, session] = await Promise.all([
    prisma.word.findMany({
      where: {
        status: WordStatus.PUBLISHED,
        ...(selectedTags.length > 0 ? { tags: { hasSome: selectedTags } } : {}),
      },
      orderBy: { word: "asc" },
    }),
    auth(),
  ]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Slová ({words.length})</h1>
      <TagFilter selected={selectedTags} />
      <div className="flex flex-col gap-4">
        {words.map((word) => (
          <WordCard
            key={word.id}
            id={word.id}
            word={word.word}
            pos={word.pos}
            tags={word.tags}
            meaning={word.meaning}
            slug={word.slug}
            status={word.status}
            isAdmin={isAdmin}
          />
        ))}
        {words.length === 0 && (
          <p className="text-foreground/60">Žiadne slová nezodpovedajú filtru.</p>
        )}
      </div>
    </div>
  );
}
