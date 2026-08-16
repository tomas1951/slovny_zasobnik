-- word_meanings rows are fully reproducible via `prisma db seed` (seed-owned
-- rows get recreated; the two SEED_TEST_DATA fixtures do too), so clear the
-- table up front rather than try to preserve orphaned lemmaId references
-- through the rename below.
DELETE FROM "word_reports";
DELETE FROM "word_meanings";

-- DropForeignKey
ALTER TABLE "_LemmaToTag" DROP CONSTRAINT IF EXISTS "_LemmaToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_LemmaToTag" DROP CONSTRAINT IF EXISTS "_LemmaToTag_B_fkey";

-- DropForeignKey
ALTER TABLE "word_meanings" DROP CONSTRAINT IF EXISTS "word_meanings_lemmaId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "word_meanings_lemmaId_idx";

-- AlterTable
ALTER TABLE "word_meanings" DROP COLUMN IF EXISTS "lemmaId",
ADD COLUMN IF NOT EXISTS "wordId" TEXT NOT NULL;

-- DropTable
DROP TABLE IF EXISTS "_LemmaToTag";

-- DropTable
DROP TABLE IF EXISTS "lemmas";

-- CreateTable
CREATE TABLE IF NOT EXISTS "words" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_TagToWord" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TagToWord_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "words_slug_key" ON "words"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "words_word_idx" ON "words"("word");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_TagToWord_B_index" ON "_TagToWord"("B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "word_meanings_wordId_idx" ON "word_meanings"("wordId");

-- AddForeignKey
ALTER TABLE "word_meanings" DROP CONSTRAINT IF EXISTS "word_meanings_wordId_fkey";
ALTER TABLE "word_meanings" ADD CONSTRAINT "word_meanings_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToWord" DROP CONSTRAINT IF EXISTS "_TagToWord_A_fkey";
ALTER TABLE "_TagToWord" ADD CONSTRAINT "_TagToWord_A_fkey" FOREIGN KEY ("A") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToWord" DROP CONSTRAINT IF EXISTS "_TagToWord_B_fkey";
ALTER TABLE "_TagToWord" ADD CONSTRAINT "_TagToWord_B_fkey" FOREIGN KEY ("B") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;
