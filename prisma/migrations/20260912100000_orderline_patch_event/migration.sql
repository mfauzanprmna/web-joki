ALTER TABLE "OrderLine" ADD COLUMN "patchEventId" TEXT;

CREATE INDEX "OrderLine_patchEventId_idx" ON "OrderLine"("patchEventId");

ALTER TABLE "OrderLine"
ADD CONSTRAINT "OrderLine_patchEventId_fkey"
FOREIGN KEY ("patchEventId") REFERENCES "PatchEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;