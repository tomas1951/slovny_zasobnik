-- DropForeignKey
ALTER TABLE "word_reports" DROP CONSTRAINT "word_reports_meaningId_fkey";

-- DropIndex
DROP INDEX "word_reports_meaningId_idx";

-- AlterTable
ALTER TABLE "word_meanings" DROP COLUMN "didntKnowCount",
DROP COLUMN "knewCount";

-- AlterTable
ALTER TABLE "word_reports" DROP COLUMN "meaningId",
DROP COLUMN "proposedMeaning",
ADD COLUMN     "wordId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "words" ADD COLUMN     "didntKnowCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "knewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "word_reports_wordId_idx" ON "word_reports"("wordId");

-- AddForeignKey
ALTER TABLE "word_reports" ADD CONSTRAINT "word_reports_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;
