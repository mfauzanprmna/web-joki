CREATE TABLE "JokiAccount" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JokiAccount_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order" ADD COLUMN "accountId" TEXT;

CREATE INDEX "JokiAccount_customerId_idx" ON "JokiAccount"("customerId");
CREATE INDEX "JokiAccount_gameId_idx" ON "JokiAccount"("gameId");
CREATE INDEX "Order_accountId_idx" ON "Order"("accountId");

ALTER TABLE "JokiAccount" ADD CONSTRAINT "JokiAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JokiAccount" ADD CONSTRAINT "JokiAccount_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "JokiAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "JokiAccount" ("id", "customerId", "gameId", "name", "createdAt", "updatedAt")
SELECT md5('joki-account:' || o."id"), o."customerId", o."gameId", 'Akun ' || o."orderCode", o."createdAt", o."updatedAt"
FROM "Order" o
WHERE o."accountId" IS NULL;

UPDATE "Order" o
SET "accountId" = md5('joki-account:' || o."id")
WHERE o."accountId" IS NULL;
