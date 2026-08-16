"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Save } from "lucide-react";
import { updateWordByAdmin } from "@/lib/actions/admin";
import { ALL_TAGS, TAG_LABELS, POS_OPTIONS } from "@/lib/tags";
import { WordStatus } from "@/generated/prisma/enums";

const STATUS_LABELS: Record<string, string> = {
  [WordStatus.PENDING]: "Čaká na schválenie",
  [WordStatus.PUBLISHED]: "Publikované",
  [WordStatus.REJECTED]: "Zamietnuté",
};

export function EditWordButton({
  word,
}: {
  word: {
    id: string;
    word: string;
    pos: string | null;
    slug: string;
    tags: string[];
    meaning: string;
    status: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await updateWordByAdmin(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Upraviť slovo"
        className="inline-flex items-center justify-center rounded-full p-1.5 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <Pencil className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="mt-4 w-full basis-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-4 rounded-md border border-foreground/15 p-4"
      >
        <input type="hidden" name="wordId" value={word.id} />

        <label className="flex flex-col gap-1 text-sm">
          Slovo
          <input
            type="text"
            name="word"
            defaultValue={word.word}
            required
            className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Identifikátor (slug)
          <input
            type="text"
            name="slug"
            defaultValue={word.slug}
            required
            className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Slovný druh
          <select
            name="pos"
            defaultValue={word.pos ?? ""}
            className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
          >
            <option value="">—</option>
            {POS_OPTIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Význam
          <textarea
            name="meaning"
            defaultValue={word.meaning}
            required
            rows={3}
            className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
          />
        </label>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1">Príznaky</legend>
          <div className="flex flex-wrap gap-3">
            {ALL_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-1.5">
                <input type="checkbox" name="tags" value={tag} defaultChecked={word.tags.includes(tag)} />
                {TAG_LABELS[tag]}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 text-sm">
          Stav
          <select
            name="status"
            defaultValue={word.status}
            className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-4 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-foreground/10"
          >
            <X className="h-4 w-4" />
            Zrušiť
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-strong px-4 py-1.5 text-sm text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {pending ? "Ukladám..." : "Uložiť"}
          </button>
        </div>
      </form>
    </div>
  );
}
