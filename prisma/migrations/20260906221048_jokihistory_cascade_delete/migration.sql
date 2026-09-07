-- CreateEnum
CREATE TYPE "GameSlug" AS ENUM ('genshin', 'wuwa', 'neverness');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('MENUNGGU', 'DIKERJAKAN', 'FINISHING', 'SELESAI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "ResetCycle" AS ENUM ('HARIAN', 'MINGGU_1', 'MINGGU_2', 'MINGGU_3', 'BULAN_1', 'PATCH_1');

-- CreateEnum
CREATE TYPE "QuestKind" AS ENUM ('WORLD', 'ARCHON', 'LAINNYA');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('DISCORD', 'INSTAGRAM', 'TIKTOK', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "DayTaskStatus" AS ENUM ('BELUM', 'SEDANG', 'SELESAI');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "slug" "GameSlug" NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JokiCategory" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiresRegion" BOOLEAN NOT NULL DEFAULT false,
    "requiresQuestType" BOOLEAN NOT NULL DEFAULT false,
    "isRawatAkun" BOOLEAN NOT NULL DEFAULT false,
    "isMaterial" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JokiCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRegion" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestType" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isRegionSpecific" BOOLEAN NOT NULL DEFAULT false,
    "questKind" "QuestKind" NOT NULL DEFAULT 'LAINNYA',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patch" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatchEvent" (
    "id" TEXT NOT NULL,
    "patchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceRupiah" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EndgameContent" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceRupiah" INTEGER NOT NULL,
    "resetCycle" "ResetCycle" NOT NULL,
    "anchorStartDate" TIMESTAMP(3),
    "daysAfterPatchStart" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EndgameContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JokiItem" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "regionId" TEXT,
    "questTypeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceRupiah" INTEGER NOT NULL,
    "etaLabel" TEXT NOT NULL,
    "badge" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "includeEvent" BOOLEAN NOT NULL DEFAULT false,
    "isPatchWide" BOOLEAN NOT NULL DEFAULT false,
    "patchId" TEXT,
    "actNumber" INTEGER DEFAULT 1,
    "unitQuantity" INTEGER,
    "durationDays" INTEGER,

    CONSTRAINT "JokiItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JokiPaket" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceRupiah" INTEGER NOT NULL,
    "regionId" TEXT,
    "isAllMapRegion" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JokiPaket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JokiPaketItem" (
    "jokiPaketId" TEXT NOT NULL,
    "jokiItemId" TEXT NOT NULL,

    CONSTRAINT "JokiPaketItem_pkey" PRIMARY KEY ("jokiPaketId","jokiItemId")
);

-- CreateTable
CREATE TABLE "JokiItemEndgameContent" (
    "jokiItemId" TEXT NOT NULL,
    "endgameContentId" TEXT NOT NULL,

    CONSTRAINT "JokiItemEndgameContent_pkey" PRIMARY KEY ("jokiItemId","endgameContentId")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "publicSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "jokerName" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'MENUNGGU',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "estimasiJoki" TEXT,
    "totalPrice" INTEGER NOT NULL DEFAULT 0,
    "orderSource" "OrderSource" NOT NULL,
    "sourceUsername" TEXT NOT NULL,
    "sourceWhatsapp" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "jokiItemId" TEXT,
    "jokiPaketId" TEXT,
    "explorationPercent" INTEGER,
    "actFrom" INTEGER,
    "actTo" INTEGER,
    "materialQuantity" INTEGER,
    "rawatAkunQuantity" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "calculatedPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLineUpdate" (
    "id" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "note" TEXT,
    "screenshotUrl" TEXT,
    "resetLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLineUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLineDayProgress" (
    "id" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "percent" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "screenshotUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderLineDayProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLineDayTask" (
    "id" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "DayTaskStatus" NOT NULL DEFAULT 'BELUM',
    "note" TEXT,
    "sourceKey" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderLineDayTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "orderId" TEXT,
    "customerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JokiHistoryEntry" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "jokerName" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "rating" INTEGER,
    "note" TEXT,
    "screenshotUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JokiHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "JokiCategory_gameId_idx" ON "JokiCategory"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "JokiCategory_gameId_name_key" ON "JokiCategory"("gameId", "name");

-- CreateIndex
CREATE INDEX "GameRegion_gameId_idx" ON "GameRegion"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameRegion_gameId_name_key" ON "GameRegion"("gameId", "name");

-- CreateIndex
CREATE INDEX "QuestType_gameId_idx" ON "QuestType"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestType_gameId_name_key" ON "QuestType"("gameId", "name");

-- CreateIndex
CREATE INDEX "Patch_gameId_idx" ON "Patch"("gameId");

-- CreateIndex
CREATE INDEX "Patch_startDate_endDate_idx" ON "Patch"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Patch_gameId_name_key" ON "Patch"("gameId", "name");

-- CreateIndex
CREATE INDEX "PatchEvent_patchId_idx" ON "PatchEvent"("patchId");

-- CreateIndex
CREATE INDEX "PatchEvent_startDate_endDate_idx" ON "PatchEvent"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "EndgameContent_gameId_idx" ON "EndgameContent"("gameId");

-- CreateIndex
CREATE INDEX "JokiItem_gameId_idx" ON "JokiItem"("gameId");

-- CreateIndex
CREATE INDEX "JokiItem_categoryId_idx" ON "JokiItem"("categoryId");

-- CreateIndex
CREATE INDEX "JokiItem_regionId_idx" ON "JokiItem"("regionId");

-- CreateIndex
CREATE INDEX "JokiItem_questTypeId_idx" ON "JokiItem"("questTypeId");

-- CreateIndex
CREATE INDEX "JokiItem_patchId_idx" ON "JokiItem"("patchId");

-- CreateIndex
CREATE INDEX "JokiPaket_gameId_idx" ON "JokiPaket"("gameId");

-- CreateIndex
CREATE INDEX "JokiPaket_regionId_idx" ON "JokiPaket"("regionId");

-- CreateIndex
CREATE INDEX "JokiPaketItem_jokiItemId_idx" ON "JokiPaketItem"("jokiItemId");

-- CreateIndex
CREATE INDEX "JokiItemEndgameContent_endgameContentId_idx" ON "JokiItemEndgameContent"("endgameContentId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_publicSlug_key" ON "Customer"("publicSlug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_gameId_idx" ON "Order"("gameId");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "OrderLine_orderId_idx" ON "OrderLine"("orderId");

-- CreateIndex
CREATE INDEX "OrderLine_jokiItemId_idx" ON "OrderLine"("jokiItemId");

-- CreateIndex
CREATE INDEX "OrderLine_jokiPaketId_idx" ON "OrderLine"("jokiPaketId");

-- CreateIndex
CREATE INDEX "OrderLineUpdate_orderLineId_idx" ON "OrderLineUpdate"("orderLineId");

-- CreateIndex
CREATE INDEX "OrderLineDayProgress_orderLineId_idx" ON "OrderLineDayProgress"("orderLineId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderLineDayProgress_orderLineId_date_key" ON "OrderLineDayProgress"("orderLineId", "date");

-- CreateIndex
CREATE INDEX "OrderLineDayTask_orderLineId_date_idx" ON "OrderLineDayTask"("orderLineId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "OrderLineDayTask_orderLineId_date_sourceKey_key" ON "OrderLineDayTask"("orderLineId", "date", "sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_orderId_key" ON "Testimonial"("orderId");

-- CreateIndex
CREATE INDEX "Testimonial_gameId_idx" ON "Testimonial"("gameId");

-- CreateIndex
CREATE INDEX "JokiHistoryEntry_gameId_idx" ON "JokiHistoryEntry"("gameId");

-- CreateIndex
CREATE INDEX "JokiHistoryEntry_completedAt_idx" ON "JokiHistoryEntry"("completedAt");

-- AddForeignKey
ALTER TABLE "JokiCategory" ADD CONSTRAINT "JokiCategory_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRegion" ADD CONSTRAINT "GameRegion_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestType" ADD CONSTRAINT "QuestType_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patch" ADD CONSTRAINT "Patch_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatchEvent" ADD CONSTRAINT "PatchEvent_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EndgameContent" ADD CONSTRAINT "EndgameContent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokiItem" ADD CONSTRAINT "JokiItem_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokiItem" ADD CONSTRAINT "JokiItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "JokiCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokiItem" ADD CONSTRAINT "JokiItem_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "GameRegion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokiItem" ADD CONSTRAINT "JokiItem_questTypeId_fkey" FOREIGN KEY ("questTypeId") REFERENCES "QuestType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokiItem" ADD CONSTRAINT "JokiItem_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokiPaket" ADD CONSTRAINT "JokiPaket_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokiPaket" ADD CONSTRAINT "JokiPaket_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "GameRegion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokiPaketItem" ADD CONSTRAINT "JokiPaketItem_jokiPaketId_fkey" FOREIGN KEY ("jokiPaketId") REFERENCES "JokiPaket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokiPaketItem" ADD CONSTRAINT "JokiPaketItem_jokiItemId_fkey" FOREIGN KEY ("jokiItemId") REFERENCES "JokiItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokiItemEndgameContent" ADD CONSTRAINT "JokiItemEndgameContent_jokiItemId_fkey" FOREIGN KEY ("jokiItemId") REFERENCES "JokiItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokiItemEndgameContent" ADD CONSTRAINT "JokiItemEndgameContent_endgameContentId_fkey" FOREIGN KEY ("endgameContentId") REFERENCES "EndgameContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_jokiItemId_fkey" FOREIGN KEY ("jokiItemId") REFERENCES "JokiItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_jokiPaketId_fkey" FOREIGN KEY ("jokiPaketId") REFERENCES "JokiPaket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineUpdate" ADD CONSTRAINT "OrderLineUpdate_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineDayProgress" ADD CONSTRAINT "OrderLineDayProgress_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineDayTask" ADD CONSTRAINT "OrderLineDayTask_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokiHistoryEntry" ADD CONSTRAINT "JokiHistoryEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
