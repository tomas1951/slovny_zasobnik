"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Save } from "lucide-react";
import { updateWordTags } from "@/lib/actions/admin";

export function EditWordTagsButton({
  wordId,
  currentTags,
  catalog,
}: {
  wordId: string;
  currentTags: string[];
  catalog: { slug: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tags = formData.getAll("tags").map(String);
    startTransition(async () => {
      await updateWordTags(wordId, tags);
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Upraviť príznaky"
        className="inline-flex items-center justify-center rounded-full p-1 text-foreground/40 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 flex w-full basis-full flex-wrap items-center gap-3 rounded-md border border-foreground/15 p-3"
    >
      {catalog.map((tag) => (
        <label key={tag.slug} className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" name="tags" value={tag.slug} defaultChecked={currentTags.includes(tag.slug)} />
          {tag.label}
        </label>
      ))}
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1 text-sm text-foreground/80 transition-colors hover:bg-foreground/10"
        >
          <X className="h-3.5 w-3.5" />
          Zrušiť
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-strong px-3 py-1 text-sm text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {pending ? "Ukladám..." : "Uložiť"}
        </button>
      </div>
    </form>
  );
}
