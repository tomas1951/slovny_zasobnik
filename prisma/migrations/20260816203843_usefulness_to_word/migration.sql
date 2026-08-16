-- AlterTable: add the word-level counters first (defaulting to 0)
ALTER TABLE "words" ADD COLUMN     "notUsefulCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usefulCount" INTEGER NOT NULL DEFAULT 0;

-- Preserve existing votes: sum each word's per-meaning usefulness counts
-- onto the new word-level counters before the per-meaning columns are
-- dropped, rather than resetting real interaction data to zero.
UPDATE "words" w
SET "usefulCount" = agg."usefulSum",
    "notUsefulCount" = agg."notUsefulSum"
FROM (
    SELECT "wordId", SUM("usefulCount") AS "usefulSum", SUM("notUsefulCount") AS "notUsefulSum"
    FROM "word_meanings"
    GROUP BY "wordId"
) agg
WHERE w.id = agg."wordId";

-- AlterTable
ALTER TABLE "word_meanings" DROP COLUMN "notUsefulCount",
DROP COLUMN "usefulCount";
