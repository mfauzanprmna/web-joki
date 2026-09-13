ALTER TABLE "EndgameContent" ADD COLUMN "isOrderable" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "OrderLine" ADD COLUMN "endgameContentId" TEXT;

CREATE INDEX "OrderLine_endgameContentId_idx" ON "OrderLine"("endgameContentId");

ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_endgameContentId_fkey" FOREIGN KEY ("endgameContentId") REFERENCES "EndgameContent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
