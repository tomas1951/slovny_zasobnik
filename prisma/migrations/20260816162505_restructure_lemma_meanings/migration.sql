-- DropForeignKey
ALTER TABLE "word_reports" DROP CONSTRAINT "word_reports_wordId_fkey";

-- DropForeignKey
ALTER TABLE "words" DROP CONSTRAINT "words_reviewedById_fkey";

-- DropForeignKey
ALTER TABLE "words" DROP CONSTRAINT "words_submittedById_fkey";

-- DropIndex
DROP INDEX "word_reports_wordId_idx";

-- AlterTable
ALTER TABLE "word_reports" DROP COLUMN "wordId",
ADD COLUMN     "meaningId" TEXT NOT NULL;

-- DropTable
DROP TABLE "words";

-- CreateTable
CREATE TABLE "lemmas" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lemmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_meanings" (
    "id" TEXT NOT NULL,
    "pos" TEXT,
    "tags" TEXT[],
    "meaning" TEXT NOT NULL,
    "status" "WordStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lemmaId" TEXT NOT NULL,
    "submittedById" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "knewCount" INTEGER NOT NULL DEFAULT 0,
    "didntKnowCount" INTEGER NOT NULL DEFAULT 0,
    "usefulCount" INTEGER NOT NULL DEFAULT 0,
    "notUsefulCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "word_meanings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lemmas_slug_key" ON "lemmas"("slug");

-- CreateIndex
CREATE INDEX "lemmas_word_idx" ON "lemmas"("word");

-- CreateIndex
CREATE INDEX "word_meanings_status_idx" ON "word_meanings"("status");

-- CreateIndex
CREATE INDEX "word_meanings_lemmaId_idx" ON "word_meanings"("lemmaId");

-- CreateIndex
CREATE INDEX "word_reports_meaningId_idx" ON "word_reports"("meaningId");

-- AddForeignKey
ALTER TABLE "word_meanings" ADD CONSTRAINT "word_meanings_lemmaId_fkey" FOREIGN KEY ("lemmaId") REFERENCES "lemmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_meanings" ADD CONSTRAINT "word_meanings_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_meanings" ADD CONSTRAINT "word_meanings_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_reports" ADD CONSTRAINT "word_reports_meaningId_fkey" FOREIGN KEY ("meaningId") REFERENCES "word_meanings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
