"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { voteWordUsefulness } from "@/lib/actions/usefulness";

type Choice = "useful" | "not-useful";

function noopSubscribe() {
  return () => {};
}

function readStoredVote(wordId: string): Choice | null {
  const stored = localStorage.getItem(`word-usefulness:${wordId}`);
  return stored === "useful" || stored === "not-useful" ? stored : null;
}

function getServerVoteSnapshot() {
  return null;
}

export function UsefulnessWidget({
  wordId,
  initialUseful,
  initialNotUseful,
  isAuthenticated,
}: {
  wordId: string;
  initialUseful: number;
  initialNotUseful: number;
  isAuthenticated: boolean;
}) {
  const storedVote = useSyncExternalStore(
    noopSubscribe,
    () => readStoredVote(wordId),
    getServerVoteSnapshot,
  );
  const [localVote, setLocalVote] = useState<Choice | null | undefined>(undefined);
  const [counts, setCounts] = useState({ useful: initialUseful, notUseful: initialNotUseful });
  const [showLoginNotice, setShowLoginNotice] = useState(false);
  const [isPending, startTransition] = useTransition();

  const voted = localVote === undefined ? storedVote : localVote;

  function vote(choice: Choice) {
    if (!isAuthenticated) {
      setShowLoginNotice(true);
      return;
    }

    const previous = voted;
    const next = choice === previous ? null : choice;

    setLocalVote(next);
    if (next) localStorage.setItem(`word-usefulness:${wordId}`, next);
    else localStorage.removeItem(`word-usefulness:${wordId}`);
    setCounts((c) => {
      const nextCounts = { ...c };
      if (next === "useful") nextCounts.useful += 1;
      else if (next === "not-useful") nextCounts.notUseful += 1;
      if (previous === "useful") nextCounts.useful -= 1;
      else if (previous === "not-useful") nextCounts.notUseful -= 1;
      return nextCounts;
    });
    startTransition(async () => {
      await voteWordUsefulness(wordId, next, previous);
    });
  }

  function buttonClasses(choice: Choice, count: number) {
    const isSelected = voted === choice;
    const colorClasses =
      count > 0
        ? choice === "useful"
          ? "bg-green-500/15 text-green-700 hover:bg-green-500/25"
          : "bg-red-500/15 text-red-700 hover:bg-red-500/25"
        : "bg-foreground/5 text-foreground/80 hover:bg-foreground/10";
    const selectedRing = isSelected ? "ring-2 ring-foreground" : "";
    const pendingOpacity = isPending ? "opacity-60" : "";
    return `inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-colors disabled:cursor-default ${colorClasses} ${selectedRing} ${pendingOpacity}`;
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => vote("useful")}
          className={buttonClasses("useful", counts.useful)}
        >
          <ThumbsUp className="h-4 w-4" />
          Užitočné ({counts.useful})
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => vote("not-useful")}
          className={buttonClasses("not-useful", counts.notUseful)}
        >
          <ThumbsDown className="h-4 w-4" />
          Neužitočné ({counts.notUseful})
        </button>
      </div>
      {showLoginNotice && (
        <p className="mt-2 text-sm text-foreground/60">
          Hodnotiť slová môžu iba{" "}
          <Link href="/login" className="text-accent-text underline hover:no-underline">
            registrovaní používatelia
          </Link>
          .
        </p>
      )}
    </div>
  );
}
