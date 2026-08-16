import Link from "next/link";
import { ChevronRight, CalendarDays } from "lucide-react";
import { getWordOfTheDay } from "@/lib/wordOfDay";
import { getPublishedWordSlugs, getPublishedWordBySlug } from "@/lib/wordNav";
import { auth } from "@/lib/auth";
import { WordCard } from "@/components/WordCard";
import { UsefulnessWidget } from "@/components/UsefulnessWidget";
import { WordPoll } from "@/components/WordPoll";
import { ReportIssueButton } from "@/components/ReportIssueButton";

export const revalidate = 3600;

function pickRandomSlug(slugs: string[], excludeSlug: string): string | null {
  if (slugs.length === 0) return null;
  if (slugs.length === 1) return slugs[0];
  const pool = slugs.filter((s) => s !== excludeSlug);
  return pool[Math.floor(Math.random() * pool.length)];
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const requestedSlug = typeof params.slovo === "string" ? params.slovo : undefined;

  const [wordOfDay, slugs] = await Promise.all([getWordOfTheDay(), getPublishedWordSlugs()]);
  const requestedWord = requestedSlug ? await getPublishedWordBySlug(requestedSlug) : null;
  const word = requestedWord ?? wordOfDay;
  const isBrowsing = requestedWord !== null && requestedWord.id !== wordOfDay?.id;

  const topSection = (
    <div className="grid gap-8 lg:grid-cols-[1fr_220px] lg:items-start">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Dopĺňame zásobník slovnej zásoby
        </h1>
        <p className="mt-3 max-w-xl text-foreground/70">
          Archaické, nárečové a historické slová sú len úvodným výberom. Skutočným cieľom je
          rozširovať aktívnu slovnú zásobu slovenčiny — objavovať zabudnuté a málo používané
          slová, ktoré stoja za to znova začať používať.
        </p>
      </div>

      {wordOfDay && (
        <aside className="lg:sticky lg:top-8">
          <Link
            href="/"
            className="block rounded-lg border border-foreground/10 bg-background p-5 transition-colors hover:border-accent-strong/40"
          >
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent-text">
              <CalendarDays className="h-3.5 w-3.5" />
              Slovo dňa
            </div>
            <p className="mt-2 text-lg font-semibold">{wordOfDay.word}</p>
            <p className="mt-1 line-clamp-2 text-sm text-foreground/60">{wordOfDay.meaning}</p>
          </Link>
        </aside>
      )}
    </div>
  );

  if (!word) {
    return (
      <div>
        {topSection}
        <p className="mt-10 text-foreground/60">V databáze zatiaľ nie je žiadne slovo.</p>
      </div>
    );
  }

  const nextSlug = pickRandomSlug(slugs, word.slug);
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div>
      {topSection}

      <div className="mt-10">
        <h2 className="mb-6 text-sm font-medium uppercase tracking-wide text-accent-text">
          {isBrowsing ? "Prehliadané slovo" : "Slovo dňa"}
        </h2>

        <WordCard
          id={word.id}
          word={word.word}
          pos={word.pos}
          tags={word.tags}
          meaning={word.meaning}
          slug={word.slug}
          status={word.status}
          isAdmin={isAdmin}
        >
          <div className="mt-6 flex flex-wrap items-start justify-between gap-8 border-t border-foreground/10 pt-4">
            <div>
              <WordPoll
                key={word.id}
                wordId={word.id}
                initialKnew={word.knewCount}
                initialDidntKnow={word.didntKnowCount}
              />
            </div>

            <div>
              <p className="mb-2 text-sm text-foreground/60">Hodnotenie významu slova:</p>
              <div className="flex flex-wrap items-center gap-3">
                <UsefulnessWidget
                  key={`useful-${word.id}`}
                  wordId={word.id}
                  initialUseful={word.usefulCount}
                  initialNotUseful={word.notUsefulCount}
                  isAuthenticated={!!session?.user}
                />
                <ReportIssueButton
                  key={`report-${word.id}`}
                  wordId={word.id}
                  word={word.word}
                  pos={word.pos}
                  slug={word.slug}
                  tags={word.tags}
                  meaning={word.meaning}
                />
              </div>
            </div>
          </div>
        </WordCard>

        {nextSlug && (
          <div className="mt-6 flex justify-center">
            <Link
              href={`/?slovo=${nextSlug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent-strong px-4 py-1.5 text-on-accent transition-all duration-200 hover:translate-x-2 hover:opacity-90"
            >
              Naučiť sa ďalšie slovo
              <ChevronRight className="h-4 w-4 animate-nudge-right" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
