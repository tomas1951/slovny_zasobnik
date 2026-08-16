"use client";

import { useActionState, useState } from "react";
import { Flag, CheckCircle2, Send } from "lucide-react";
import { reportWordIssue } from "@/lib/actions/reports";

const readonlyFieldClasses =
  "rounded-md border border-foreground/10 bg-foreground/5 px-3 py-2 text-foreground/70 disabled:cursor-not-allowed";

export function ReportIssueButton({
  wordId,
  word,
  wordTags,
  tagCatalog,
}: {
  wordId: string;
  word: string;
  wordTags: string[];
  tagCatalog: { slug: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(reportWordIssue, undefined);

  if (state?.success) {
    return (
      <p className="flex w-fit items-center gap-1.5 text-sm text-foreground/60">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Ďakujeme, návrh úpravy sme zaznamenali.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-fit items-center gap-1.5 rounded-full bg-foreground/5 px-4 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-foreground/10"
      >
        <Flag className="h-4 w-4" />
        Navrhnúť úpravu slova
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-4 rounded-md border border-foreground/15 p-4"
    >
      <input type="hidden" name="wordId" value={wordId} />

      <label className="flex flex-col gap-1 text-sm text-foreground/60">
        Slovo
        <input type="text" value={word} disabled className={readonlyFieldClasses} />
      </label>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-1">Príznaky slova</legend>
        <div className="flex flex-wrap gap-3">
          {tagCatalog.map((tag) => (
            <label key={tag.slug} className="flex items-center gap-1.5">
              <input type="checkbox" name="tags" value={tag.slug} defaultChecked={wordTags.includes(tag.slug)} />
              {tag.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        Doplňujúca poznámka (nepovinné)
        <textarea
          name="message"
          placeholder="Napr. ktorý význam je zle sformulovaný a ako by mal znieť"
          rows={2}
          className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
        />
      </label>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full bg-foreground/5 px-4 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-foreground/10"
        >
          Zrušiť
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-strong px-4 py-1.5 text-sm text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {pending ? "Odosielam..." : "Odoslať"}
        </button>
      </div>
    </form>
  );
}
