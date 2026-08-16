import { Tag, Check, X, Flag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { WordStatus } from "@/generated/prisma/enums";
import { TAG_LABELS } from "@/lib/tags";
import { approveWord, rejectWord, applyWordReport, dismissWordReport } from "@/lib/actions/admin";
import { EditWordButton } from "@/components/EditWordButton";

export default async function AdminSubmissionsPage() {
  const [submissions, reports] = await Promise.all([
    prisma.word.findMany({
      where: { status: WordStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: { submittedBy: { select: { name: true, email: true } } },
    }),
    prisma.wordReport.findMany({
      orderBy: { createdAt: "asc" },
      include: { word: true, reporter: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="mb-6 text-2xl font-semibold">Nové slová na schválenie ({submissions.length})</h1>
        <div className="flex flex-col gap-4">
          {submissions.map((word) => (
            <article key={word.id} className="rounded-lg border border-foreground/10 p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="text-xl font-semibold">{word.word}</h2>
                {word.pos && <span className="text-sm text-foreground/50">{word.pos}</span>}
                <EditWordButton
                  word={{
                    id: word.id,
                    word: word.word,
                    pos: word.pos,
                    slug: word.slug,
                    tags: word.tags,
                    meaning: word.meaning,
                    status: word.status,
                  }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {word.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent-text"
                  >
                    <Tag className="h-3 w-3" />
                    {TAG_LABELS[tag] ?? tag}
                  </span>
                ))}
              </div>
              <p className="mt-3">{word.meaning}</p>
              <p className="mt-3 text-xs text-foreground/40">
                Od: {word.submittedBy?.name ?? word.submittedBy?.email ?? "neznámy"}
              </p>
              <div className="mt-4 flex gap-3">
                <form action={approveWord.bind(null, word.id)}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-1.5 text-sm text-white hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    Schváliť
                  </button>
                </form>
                <form action={rejectWord.bind(null, word.id)}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                    Zamietnuť
                  </button>
                </form>
              </div>
            </article>
          ))}
          {submissions.length === 0 && (
            <p className="text-foreground/60">Žiadne nové slová na schválenie.</p>
          )}
        </div>
      </section>

      <section>
        <h1 className="mb-6 text-2xl font-semibold">Návrhy na úpravu ({reports.length})</h1>
        <div className="flex flex-col gap-4">
          {reports.map((report) => (
            <article key={report.id} className="rounded-lg border border-foreground/10 p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Flag className="h-4 w-4 text-foreground/50" />
                  {report.word.word}
                </h2>
                {report.word.pos && <span className="text-sm text-foreground/50">{report.word.pos}</span>}
                <EditWordButton
                  word={{
                    id: report.word.id,
                    word: report.word.word,
                    pos: report.word.pos,
                    slug: report.word.slug,
                    tags: report.word.tags,
                    meaning: report.word.meaning,
                    status: report.word.status,
                  }}
                />
              </div>

              {report.proposedMeaning && report.proposedMeaning !== report.word.meaning && (
                <div className="mt-3 text-sm">
                  <p className="text-foreground/40">Súčasný význam</p>
                  <p className="text-foreground/70 line-through">{report.word.meaning}</p>
                  <p className="mt-1 text-foreground/40">Navrhovaný význam</p>
                  <p>{report.proposedMeaning}</p>
                </div>
              )}

              {report.proposedTags.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-foreground/40">Navrhované príznaky</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {report.proposedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent-text"
                      >
                        <Tag className="h-3 w-3" />
                        {TAG_LABELS[tag] ?? tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {report.message && (
                <p className="mt-3 text-sm text-foreground/70">„{report.message}“</p>
              )}

              <p className="mt-3 text-xs text-foreground/40">
                Od: {report.reporter?.name ?? report.reporter?.email ?? "anonymný"}
              </p>

              <div className="mt-4 flex gap-3">
                <form action={applyWordReport.bind(null, report.id)}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-1.5 text-sm text-white hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    Použiť úpravu
                  </button>
                </form>
                <form action={dismissWordReport.bind(null, report.id)}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                    Zamietnuť
                  </button>
                </form>
              </div>
            </article>
          ))}
          {reports.length === 0 && <p className="text-foreground/60">Žiadne návrhy na úpravu.</p>}
        </div>
      </section>
    </div>
  );
}
