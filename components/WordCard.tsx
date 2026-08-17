import Link from "next/link";
import type { ReactNode } from "react";
import { Tag } from "lucide-react";
import { EditWordButton } from "@/components/EditWordButton";
import { EditWordTagsButton } from "@/components/EditWordTagsButton";
import { DeleteWordButton } from "@/components/DeleteWordButton";

export type WordCardMeaning = {
  id: string;
  pos: string | null;
  meaning: string;
  status?: string;
};

export type WordCardTag = { slug: string; label: string };

export function WordCard<M extends WordCardMeaning>({
  wordId,
  word,
  slug,
  tags,
  meanings,
  isAdmin,
  tagCatalog,
  renderWordExtra,
}: {
  wordId?: string;
  word: string;
  slug?: string;
  tags: WordCardTag[];
  meanings: M[];
  isAdmin?: boolean;
  tagCatalog?: WordCardTag[];
  renderWordExtra?: () => ReactNode;
}) {
  return (
    <article className="rounded-lg border border-foreground/10 bg-background p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold">
          {slug ? (
            <Link href={`/words/${slug}`} className="hover:text-accent-strong hover:underline">
              {word}
            </Link>
          ) : (
            word
          )}
        </h2>
        {isAdmin && wordId && <DeleteWordButton wordId={wordId} word={word} />}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag.slug}
            className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent-text"
          >
            <Tag className="h-3 w-3" />
            {tag.label}
          </span>
        ))}
        {isAdmin && wordId && tagCatalog && (
          <EditWordTagsButton
            key={wordId}
            wordId={wordId}
            currentTags={tags.map((t) => t.slug)}
            catalog={tagCatalog}
          />
        )}
      </div>

      <ol className="mt-4 flex flex-col gap-6">
        {meanings.map((m, i) => (
          <li key={m.id} className={i > 0 ? "border-t border-foreground/10 pt-6" : undefined}>
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-2">
                {meanings.length > 1 && <span className="text-sm font-medium text-foreground/40">{i + 1}.</span>}
                {m.pos && <span className="text-sm text-foreground/50">{m.pos}</span>}
              </div>
              {isAdmin && <EditWordButton meaning={{ ...m, status: m.status ?? "PUBLISHED" }} />}
            </div>
            <p className="mt-3 text-base leading-relaxed">{m.meaning}</p>
          </li>
        ))}
      </ol>

      {renderWordExtra?.()}
    </article>
  );
}
