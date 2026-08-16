import Link from "next/link";

export function TagFilter({
  selected,
  catalog,
}: {
  selected: string[];
  catalog: { slug: string; label: string }[];
}) {
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
      {catalog.map((tag) => {
        const isSelected = selected.includes(tag.slug);
        const nextTags = isSelected
          ? selected.filter((t) => t !== tag.slug)
          : [...selected, tag.slug];
        const href = nextTags.length > 0 ? `/words?tags=${nextTags.join(",")}` : "/words";

        return (
          <Link
            key={tag.slug}
            href={href}
            className={`rounded-full px-3 py-1 text-sm ${
              isSelected
                ? "bg-accent-strong text-on-accent"
                : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
            }`}
          >
            {tag.label}
          </Link>
        );
      })}
    </div>
  );
}
