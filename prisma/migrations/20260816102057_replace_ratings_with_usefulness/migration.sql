-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_userId_fkey";

-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_wordId_fkey";

-- AlterTable
ALTER TABLE "words" ADD COLUMN     "notUsefulCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usefulCount" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "ratings";
