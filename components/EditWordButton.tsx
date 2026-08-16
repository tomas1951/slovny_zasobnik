"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Save } from "lucide-react";
import { updateWordByAdmin } from "@/lib/actions/admin";
import { POS_OPTIONS } from "@/lib/tags";
import { WordStatus } from "@/generated/prisma/enums";

const STATUS_LABELS: Record<string, string> = {
  [WordStatus.PENDING]: "Čaká na schválenie",
  [WordStatus.PUBLISHED]: "Publikované",
  [WordStatus.REJECTED]: "Zamietnuté",
};

export function EditWordButton({
  meaning,
}: {
  meaning: {
    id: string;
    pos: string | null;
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
        <input type="hidden" name="meaningId" value={meaning.id} />

        <label className="flex flex-col gap-1 text-sm">
          Slovný druh
          <select
            name="pos"
            defaultValue={meaning.pos ?? ""}
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
            defaultValue={meaning.meaning}
            required
            rows={3}
            className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Stav
          <select
            name="status"
            defaultValue={meaning.status}
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
