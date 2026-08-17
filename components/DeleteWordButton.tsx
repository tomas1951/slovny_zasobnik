"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, Check } from "lucide-react";
import { deleteWord } from "@/lib/actions/admin";

export function DeleteWordButton({ wordId, word }: { wordId: string; word: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteWord(wordId);
      router.push("/words");
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-foreground/70">
        Vymazať „{word}“ natrvalo?
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          aria-label="Potvrdiť vymazanie"
          className="inline-flex items-center justify-center rounded-full bg-red-600 p-1 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          aria-label="Zrušiť"
          className="inline-flex items-center justify-center rounded-full p-1 text-foreground/40 transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="Vymazať slovo"
      className="inline-flex items-center justify-center rounded-full p-1.5 text-foreground/40 transition-colors hover:bg-red-600/10 hover:text-red-600"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
