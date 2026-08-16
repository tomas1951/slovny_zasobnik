import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WordStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { WordCard } from "@/components/WordCard";
import { UsefulnessWidget } from "@/components/UsefulnessWidget";
import { WordPoll } from "@/components/WordPoll";
import { getTagCatalog } from "@/lib/tagCatalog";

export default async function WordDetailPage({ params }: PageProps<"/words/[slug]">) {
  const { slug } = await params;

  const word = await prisma.word.findUnique({
    where: { slug },
    include: {
      meanings: { where: { status: WordStatus.PUBLISHED }, orderBy: { createdAt: "asc" } },
      tags: { orderBy: { order: "asc" } },
    },
  });
  if (!word || word.meanings.length === 0) {
    notFound();
  }

  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const tagCatalog = await getTagCatalog();

  return (
    <article>
      <Link href="/words" className="text-sm text-foreground/50 hover:text-accent-text hover:underline">
        ← Späť na zoznam
      </Link>

      <div className="mt-4">
        <WordCard
          wordId={word.id}
          word={word.word}
          tags={word.tags}
          meanings={word.meanings}
          isAdmin={isAdmin}
          tagCatalog={tagCatalog}
          renderWordExtra={() => (
            <div className="mt-6 flex flex-wrap items-start gap-8 border-t border-foreground/10 pt-6">
              <div>
                <p className="mb-2 text-sm text-foreground/60">Hodnotenie významu slova:</p>
                <UsefulnessWidget
                  key={`useful-${word.id}`}
                  wordId={word.id}
                  initialUseful={word.usefulCount}
                  initialNotUseful={word.notUsefulCount}
                  isAuthenticated={!!session?.user}
                />
              </div>
              <div>
                <WordPoll
                  key={`poll-${word.id}`}
                  wordId={word.id}
                  initialKnew={word.knewCount}
                  initialDidntKnow={word.didntKnowCount}
                />
              </div>
            </div>
          )}
        />
      </div>
    </article>
  );
}
