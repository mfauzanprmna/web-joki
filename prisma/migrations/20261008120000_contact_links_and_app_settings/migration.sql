-- CreateTable
CREATE TABLE "ContactLink" (
    "id" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "logoUrl" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "workerCommissionPercent" INTEGER NOT NULL DEFAULT 80,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactLink_position_idx" ON "ContactLink"("position");

-- Data awal: kontak yang sudah ada saat fitur ini dibuat (bisa diubah/dihapus
-- kapan saja lewat menu Setting di admin).
INSERT INTO "ContactLink" ("id", "icon", "name", "url", "position", "updatedAt") VALUES
    ('contact_seed_discord', 'discord', 'Discord', 'https://discord.gg/FYGzDPF9ms', 1, CURRENT_TIMESTAMP),
    ('contact_seed_tiktok', 'tiktok', 'TikTok', 'https://www.tiktok.com/@shihu_joki', 2, CURRENT_TIMESTAMP),
    ('contact_seed_instagram', 'instagram', 'Instagram', 'https://www.instagram.com/shihu_service/', 3, CURRENT_TIMESTAMP);

-- Data awal: komisi worker tetap 80% seperti sebelumnya (dulu konstanta di
-- lib/commission.ts), supaya angka yang tampil tidak berubah sampai admin
-- sendiri mengubahnya.
INSERT INTO "AppSetting" ("id", "workerCommissionPercent", "updatedAt") VALUES
    ('singleton', 80, CURRENT_TIMESTAMP);
