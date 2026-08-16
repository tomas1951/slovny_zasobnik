import { Tag, Check, X, Flag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { WordStatus } from "@/generated/prisma/enums";
import { getTagCatalog } from "@/lib/tagCatalog";
import { approveWord, rejectWord, applyWordReport, dismissWordReport } from "@/lib/actions/admin";
import { EditWordButton } from "@/components/EditWordButton";
import { EditWordTagsButton } from "@/components/EditWordTagsButton";

export default async function AdminSubmissionsPage() {
  const [submissions, reports, tagCatalog] = await Promise.all([
    prisma.wordMeaning.findMany({
      where: { status: WordStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: {
        word: { include: { tags: { orderBy: { order: "asc" } } } },
        submittedBy: { select: { name: true, email: true } },
      },
    }),
    prisma.wordReport.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        word: { include: { tags: { orderBy: { order: "asc" } } } },
        reporter: { select: { name: true, email: true } },
      },
    }),
    getTagCatalog(),
  ]);
  const tagLabel = new Map(tagCatalog.map((t) => [t.slug, t.label]));

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="mb-6 text-2xl font-semibold">Nové slová na schválenie ({submissions.length})</h1>
        <div className="flex flex-col gap-4">
          {submissions.map((meaning) => (
            <article key={meaning.id} className="rounded-lg border border-foreground/10 p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="text-xl font-semibold">{meaning.word.word}</h2>
                {meaning.pos && <span className="text-sm text-foreground/50">{meaning.pos}</span>}
                <EditWordButton
                  meaning={{
                    id: meaning.id,
                    pos: meaning.pos,
                    meaning: meaning.meaning,
                    status: meaning.status,
                  }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {meaning.word.tags.map((tag) => (
                  <span
                    key={tag.slug}
                    className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent-text"
                  >
                    <Tag className="h-3 w-3" />
                    {tag.label}
                  </span>
                ))}
                <EditWordTagsButton
                  wordId={meaning.word.id}
                  currentTags={meaning.word.tags.map((t) => t.slug)}
                  catalog={tagCatalog}
                />
              </div>
              <p className="mt-3">{meaning.meaning}</p>
              <p className="mt-3 text-xs text-foreground/40">
                Od: {meaning.submittedBy?.name ?? meaning.submittedBy?.email ?? "neznámy"}
              </p>
              <div className="mt-4 flex gap-3">
                <form action={approveWord.bind(null, meaning.id)}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-1.5 text-sm text-white hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    Schváliť
                  </button>
                </form>
                <form action={rejectWord.bind(null, meaning.id)}>
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
                <EditWordTagsButton
                  wordId={report.word.id}
                  currentTags={report.word.tags.map((t) => t.slug)}
                  catalog={tagCatalog}
                />
              </div>

              <div className="mt-3 text-sm">
                <p className="text-foreground/40">Súčasné príznaky</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {report.word.tags.map((tag) => (
                    <span
                      key={tag.slug}
                      className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent-text"
                    >
                      <Tag className="h-3 w-3" />
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>

              {report.proposedTags.length > 0 && (
                <div className="mt-3 text-sm">
                  <p className="text-foreground/40">Navrhované príznaky</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {report.proposedTags.map((slug) => (
                      <span
                        key={slug}
                        className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent-text"
                      >
                        <Tag className="h-3 w-3" />
                        {tagLabel.get(slug) ?? slug}
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
