import Link from "next/link";
import { ALL_TAGS, TAG_LABELS } from "@/lib/tags";

export function TagFilter({ selected }: { selected: string[] }) {
  return (
    <div className="mb-8 flex flex-wrap gap-2">
      <Link
        href="/words"
        className={`rounded-full px-3 py-1 text-sm ${
          selected.length === 0
            ? "bg-accent-strong text-on-accent"
            : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
        }`}
      >
        Všetky
      </Link>
      {ALL_TAGS.map((tag) => {
        const isSelected = selected.includes(tag);
        const nextTags = isSelected
          ? selected.filter((t) => t !== tag)
          : [...selected, tag];
        const href = nextTags.length > 0 ? `/words?tags=${nextTags.join(",")}` : "/words";

        return (
          <Link
            key={tag}
            href={href}
            className={`rounded-full px-3 py-1 text-sm ${
              isSelected
                ? "bg-accent-strong text-on-accent"
                : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
            }`}
          >
            {TAG_LABELS[tag] ?? tag}
          </Link>
        );
      })}
    </div>
  );
}
