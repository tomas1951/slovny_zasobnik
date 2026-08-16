-- CreateTable
CREATE TABLE "word_reports" (
    "id" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wordId" TEXT NOT NULL,
    "reporterId" TEXT,

    CONSTRAINT "word_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "word_reports_wordId_idx" ON "word_reports"("wordId");

-- AddForeignKey
ALTER TABLE "word_reports" ADD CONSTRAINT "word_reports_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_reports" ADD CONSTRAINT "word_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
