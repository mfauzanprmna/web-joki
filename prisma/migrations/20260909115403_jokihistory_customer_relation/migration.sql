/*
  Warnings:

  - You are about to drop the column `customerName` on the `JokiHistoryEntry` table. All the data in the column will be lost.
  - Added the required column `customerId` to the `JokiHistoryEntry` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
ALTER TABLE "JokiHistoryEntry" DROP COLUMN "customerName",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "JokiHistoryEntry_customerId_idx" ON "JokiHistoryEntry"("customerId");

-- AddForeignKey
ALTER TABLE "JokiHistoryEntry" ADD CONSTRAINT "JokiHistoryEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
