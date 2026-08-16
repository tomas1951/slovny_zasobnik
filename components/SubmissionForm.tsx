"use client";

import { useActionState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { submitWord } from "@/lib/actions/words";
import { ALL_TAGS, TAG_LABELS, POS_OPTIONS } from "@/lib/tags";

export function SubmissionForm() {
  const [state, formAction, pending] = useActionState(submitWord, undefined);

  if (state?.success) {
    return (
      <p className="flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Ďakujeme! Slovo bolo odoslané a čaká na schválenie administrátorom.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Slovo
        <input
          type="text"
          name="word"
          required
          className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Slovný druh (nepovinné)
        <select
          name="pos"
          defaultValue=""
          className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
        >
          <option value="">— nevybrané —</option>
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
              <input type="checkbox" name="tags" value={tag} />
              {TAG_LABELS[tag]}
            </label>
          ))}
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent-strong px-4 py-2 text-on-accent hover:opacity-90 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {pending ? "Odosielam..." : "Odoslať slovo"}
      </button>
    </form>
  );
}
