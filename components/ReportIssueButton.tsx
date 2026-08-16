"use client";

import { useActionState, useState } from "react";
import { Flag, CheckCircle2, Send } from "lucide-react";
import { reportWordIssue } from "@/lib/actions/reports";
import { ALL_TAGS, TAG_LABELS } from "@/lib/tags";

const readonlyFieldClasses =
  "rounded-md border border-foreground/10 bg-foreground/5 px-3 py-2 text-foreground/70 disabled:cursor-not-allowed";

export function ReportIssueButton({
  wordId,
  word,
  pos,
  slug,
  tags,
  meaning,
}: {
  wordId: string;
  word: string;
  pos: string | null;
  slug: string;
  tags: string[];
  meaning: string;
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

      <label className="flex flex-col gap-1 text-sm text-foreground/60">
        Slovný druh
        <input type="text" value={pos ?? "—"} disabled className={readonlyFieldClasses} />
      </label>

      <label className="flex flex-col gap-1 text-sm text-foreground/60">
        Identifikátor (slug)
        <input type="text" value={slug} disabled className={readonlyFieldClasses} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Význam
        <textarea
          name="meaning"
          defaultValue={meaning}
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
              <input type="checkbox" name="tags" value={tag} defaultChecked={tags.includes(tag)} />
              {TAG_LABELS[tag]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        Doplňujúca poznámka (nepovinné)
        <textarea
          name="message"
          placeholder="Prečo navrhujete túto zmenu?"
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
