"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { submitWordPoll } from "@/lib/actions/polls";

type Choice = "yes" | "no";

function noopSubscribe() {
  return () => {};
}

function readStoredVote(wordId: string): Choice | null {
  const stored = localStorage.getItem(`word-poll:${wordId}`);
  return stored === "yes" || stored === "no" ? stored : null;
}

function getServerVoteSnapshot() {
  return null;
}

export function WordPoll({
  wordId,
  initialKnew,
  initialDidntKnow,
}: {
  wordId: string;
  initialKnew: number;
  initialDidntKnow: number;
}) {
  const storedVote = useSyncExternalStore(
    noopSubscribe,
    () => readStoredVote(wordId),
    getServerVoteSnapshot,
  );
  const [localVote, setLocalVote] = useState<Choice | null>(null);
  const [counts, setCounts] = useState({ knew: initialKnew, didntKnow: initialDidntKnow });
  const [isChanging, setIsChanging] = useState(false);
  const [isPending, startTransition] = useTransition();

  const voted = localVote ?? storedVote;

  function vote(choice: Choice) {
    setIsChanging(false);
    if (choice === voted) return;

    const previous = voted;
    setLocalVote(choice);
    localStorage.setItem(`word-poll:${wordId}`, choice);
    setCounts((c) => {
      const next = { ...c };
      if (choice === "yes") next.knew += 1;
      else next.didntKnow += 1;
      if (previous === "yes") next.knew -= 1;
      else if (previous === "no") next.didntKnow -= 1;
      return next;
    });
    startTransition(async () => {
      await submitWordPoll(wordId, choice, previous);
    });
  }

  const total = counts.knew + counts.didntKnow;
  const knewPct = total > 0 ? Math.round((counts.knew / total) * 100) : 0;

  if (voted && !isChanging) {
    return (
      <div>
        <p className="mb-2 text-sm text-foreground/60">Poznali ste toto slovo predtým?</p>
        <div className="max-w-xs">
          <div className="flex justify-between text-sm text-foreground/70">
            <span>Poznalo ho {knewPct} %</span>
            <span>
              {total} {total === 1 ? "odpoveď" : "odpovedí"}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full bg-accent-strong" style={{ width: `${knewPct}%` }} />
          </div>
          <button
            type="button"
            onClick={() => setIsChanging(true)}
            className="mt-2 text-xs text-foreground/50 underline hover:text-accent-text hover:no-underline"
          >
            Zmeniť odpoveď
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm text-foreground/60">Poznali ste toto slovo predtým?</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => vote("yes")}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-4 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-foreground/10 disabled:opacity-50"
        >
          <ThumbsUp className="h-4 w-4" />
          Áno, poznal/a
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => vote("no")}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-4 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-foreground/10 disabled:opacity-50"
        >
          <ThumbsDown className="h-4 w-4" />
          Nie, prvýkrát
        </button>
      </div>
    </div>
  );
}
