import Link from "next/link";
import type { ReactNode } from "react";
import { Tag } from "lucide-react";
import { TAG_LABELS } from "@/lib/tags";
import { EditWordButton } from "@/components/EditWordButton";

export function WordCard({
  id,
  word,
  pos,
  tags,
  meaning,
  slug,
  status,
  isAdmin,
  children,
}: {
  id?: string;
  word: string;
  pos: string | null;
  tags: string[];
  meaning: string;
  slug?: string;
  status?: string;
  isAdmin?: boolean;
  children?: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-foreground/10 bg-background p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-2xl font-semibold">
          {slug ? (
            <Link href={`/words/${slug}`} className="hover:text-accent-strong hover:underline">
              {word}
            </Link>
          ) : (
            word
          )}
        </h2>
        {pos && <span className="text-sm text-foreground/50">{pos}</span>}
        {isAdmin && id && (
          <EditWordButton
            word={{ id, word, pos, slug: slug ?? "", tags, meaning, status: status ?? "PUBLISHED" }}
          />
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent-text"
          >
            <Tag className="h-3 w-3" />
            {TAG_LABELS[tag] ?? tag}
          </span>
        ))}
      </div>
      <p className="mt-4 text-base leading-relaxed">{meaning}</p>
      {children}
    </article>
  );
}
