/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `JokiHistoryEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jokiHistoryEntryId]` on the table `Testimonial` will be added. If there are existing duplicate values, this will fail.
  - The required column `shareToken` was added to the `JokiHistoryEntry` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "JokiHistoryEntry" ADD COLUMN     "shareToken" TEXT;
-- Backfill baris yang sudah ada dengan token random unik
UPDATE "JokiHistoryEntry"
SET "shareToken" = md5(random()::text || clock_timestamp()::text || id)
WHERE "shareToken" IS NULL;

-- Sekarang baru boleh di-set NOT NULL
ALTER TABLE "JokiHistoryEntry" ALTER COLUMN "shareToken" SET NOT NULL;

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "jokiHistoryEntryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "JokiHistoryEntry_shareToken_key" ON "JokiHistoryEntry"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_jokiHistoryEntryId_key" ON "Testimonial"("jokiHistoryEntryId");

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_jokiHistoryEntryId_fkey" FOREIGN KEY ("jokiHistoryEntryId") REFERENCES "JokiHistoryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
