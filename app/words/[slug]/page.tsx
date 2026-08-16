import { notFound } from "next/navigation";
import Link from "next/link";
import { Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { WordStatus } from "@/generated/prisma/enums";
import { TAG_LABELS } from "@/lib/tags";
import { auth } from "@/lib/auth";
import { UsefulnessWidget } from "@/components/UsefulnessWidget";
import { WordPoll } from "@/components/WordPoll";
import { EditWordButton } from "@/components/EditWordButton";

export default async function WordDetailPage({ params }: PageProps<"/words/[slug]">) {
  const { slug } = await params;

  const word = await prisma.word.findUnique({ where: { slug } });
  if (!word || word.status !== WordStatus.PUBLISHED) {
    notFound();
  }

  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <article>
      <Link href="/words" className="text-sm text-foreground/50 hover:text-accent-text hover:underline">
        ← Späť na zoznam
      </Link>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold">{word.word}</h1>
        {word.pos && <span className="text-sm text-foreground/50">{word.pos}</span>}
        {isAdmin && (
          <EditWordButton
            word={{
              id: word.id,
              word: word.word,
              pos: word.pos,
              slug: word.slug,
              tags: word.tags,
              meaning: word.meaning,
              status: word.status,
            }}
          />
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {word.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent-text"
          >
            <Tag className="h-3 w-3" />
            {TAG_LABELS[tag] ?? tag}
          </span>
        ))}
      </div>
      <p className="mt-6 text-lg leading-relaxed">{word.meaning}</p>

      <div className="mt-8 border-t border-foreground/10 pt-6">
        <p className="mb-2 text-sm text-foreground/60">Hodnotenie významu slova:</p>
        <UsefulnessWidget
          wordId={word.id}
          initialUseful={word.usefulCount}
          initialNotUseful={word.notUsefulCount}
          isAuthenticated={!!session?.user}
        />
      </div>

      <div className="mt-6 border-t border-foreground/10 pt-6">
        <WordPoll wordId={word.id} initialKnew={word.knewCount} initialDidntKnow={word.didntKnowCount} />
      </div>
    </article>
  );
}
