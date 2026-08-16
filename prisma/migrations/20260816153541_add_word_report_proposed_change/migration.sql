-- AlterTable
ALTER TABLE "word_reports" ADD COLUMN     "proposedMeaning" TEXT,
ADD COLUMN     "proposedTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
