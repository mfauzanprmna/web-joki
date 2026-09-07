import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database Shihu Service...");

  await prisma.testimonial.deleteMany();
  await prisma.jokiHistoryEntry.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.jokiPaketItem.deleteMany();
  await prisma.jokiPaket.deleteMany();
  await prisma.jokiItemEndgameContent.deleteMany();
  await prisma.jokiItem.deleteMany();
  await prisma.patchEvent.deleteMany();
  await prisma.patch.deleteMany();
  await prisma.endgameContent.deleteMany();
  await prisma.questType.deleteMany();
  await prisma.gameRegion.deleteMany();
  await prisma.jokiCategory.deleteMany();
  await prisma.game.deleteMany();

  const genshin = await prisma.game.create({
    data: {
      slug: "genshin",
      name: "Genshin Impact",
      tagline: "Open world · Gacha RPG",
      accentColor: "#FFB238",
    },
  });

  const wuwa = await prisma.game.create({
    data: {
      slug: "wuwa",
      name: "Wuthering Waves",
      tagline: "Action combat · Gacha RPG",
      accentColor: "#4FE0FF",
    },
  });

  const neverness = await prisma.game.create({
    data: {
      slug: "neverness",
      name: "Neverness to Everness",
      tagline: "Urban fantasy · Gacha RPG",
      accentColor: "#C2A3FF",
    },
  });

  // ---------- Kategori ----------
  const genshinCatPushRank = await prisma.jokiCategory.create({
    data: { gameId: genshin.id, name: "Push Rank", requiresRegion: false, requiresQuestType: false },
  });
  const genshinCatEksplor = await prisma.jokiCategory.create({
    data: { gameId: genshin.id, name: "Eksplorasi", requiresRegion: true, requiresQuestType: false },
  });
  const genshinCatQuest = await prisma.jokiCategory.create({
    data: { gameId: genshin.id, name: "Quest", requiresRegion: false, requiresQuestType: true },
  });
  const genshinCatDaily = await prisma.jokiCategory.create({
    data: { gameId: genshin.id, name: "Daily Commission", requiresRegion: false, requiresQuestType: false },
  });
  const genshinCatRawatAkun = await prisma.jokiCategory.create({
    data: { gameId: genshin.id, name: "Rawat Akun", requiresRegion: false, requiresQuestType: false, isRawatAkun: true },
  });
  const genshinCatMaterial = await prisma.jokiCategory.create({
    data: { gameId: genshin.id, name: "Material", requiresRegion: false, requiresQuestType: false, isMaterial: true },
  });

  const wuwaCatTower = await prisma.jokiCategory.create({
    data: { gameId: wuwa.id, name: "Tower Climb", requiresRegion: false, requiresQuestType: false },
  });
  const wuwaCatEksplor = await prisma.jokiCategory.create({
    data: { gameId: wuwa.id, name: "Eksplorasi", requiresRegion: true, requiresQuestType: false },
  });
  const wuwaCatQuest = await prisma.jokiCategory.create({
    data: { gameId: wuwa.id, name: "Quest", requiresRegion: false, requiresQuestType: true },
  });

  const nevernessCatQuest = await prisma.jokiCategory.create({
    data: { gameId: neverness.id, name: "Quest", requiresRegion: false, requiresQuestType: true },
  });
  const nevernessCatFarming = await prisma.jokiCategory.create({
    data: { gameId: neverness.id, name: "Farming", requiresRegion: false, requiresQuestType: false },
  });

  // ---------- Region ----------
  const [mondstadt, liyue, inazuma] = await Promise.all([
    prisma.gameRegion.create({ data: { gameId: genshin.id, name: "Mondstadt" } }),
    prisma.gameRegion.create({ data: { gameId: genshin.id, name: "Liyue" } }),
    prisma.gameRegion.create({ data: { gameId: genshin.id, name: "Inazuma" } }),
  ]);

  const [huaAo, rinascita] = await Promise.all([
    prisma.gameRegion.create({ data: { gameId: wuwa.id, name: "Hua'ao" } }),
    prisma.gameRegion.create({ data: { gameId: wuwa.id, name: "Rinascita" } }),
  ]);

  // ---------- Quest Type ----------
  const genshinQuestArchon = await prisma.questType.create({
    data: { gameId: genshin.id, name: "Archon Quest", isRegionSpecific: false, questKind: "ARCHON" },
  });
  const genshinQuestWorld = await prisma.questType.create({
    data: { gameId: genshin.id, name: "World Quest", isRegionSpecific: true, questKind: "WORLD" },
  });

  const wuwaQuestMain = await prisma.questType.create({
    data: { gameId: wuwa.id, name: "Main Story Quest", isRegionSpecific: false },
  });
  const wuwaQuestExploration = await prisma.questType.create({
    data: { gameId: wuwa.id, name: "Exploration Quest", isRegionSpecific: true, questKind: "WORLD" },
  });

  const nevernessQuestMain = await prisma.questType.create({
    data: { gameId: neverness.id, name: "Main Quest", isRegionSpecific: false },
  });

  // ---------- Patch & Event (contoh untuk Genshin) ----------
  // Patch yang sedang berjalan saat ini (dimulai 5 hari lalu, berlangsung 42 hari total)
  // supaya ada event "live" dan endgame PATCH_1 yang bisa didemokan begitu di-seed.
  const now = new Date();
  const currentPatchStart = new Date(now);
  currentPatchStart.setDate(currentPatchStart.getDate() - 5);
  const currentPatchEnd = new Date(currentPatchStart);
  currentPatchEnd.setDate(currentPatchEnd.getDate() + 42);

  const genshinPatchCurrent = await prisma.patch.create({
    data: {
      gameId: genshin.id,
      name: "Patch 5.4",
      startDate: currentPatchStart,
      endDate: currentPatchEnd,
    },
  });

  // Patch berikutnya sudah dibuat admin walau belum mulai — dipakai untuk
  // mendemokan Rawat Akun "1 patch" yang tampil sejak Patch dibuat.
  const nextPatchStart = new Date(currentPatchEnd);
  const nextPatchEnd = new Date(nextPatchStart);
  nextPatchEnd.setDate(nextPatchEnd.getDate() + 42);

  const genshinPatchNext = await prisma.patch.create({
    data: {
      gameId: genshin.id,
      name: "Patch 5.5",
      startDate: nextPatchStart,
      endDate: nextPatchEnd,
    },
  });

  // Event yang sedang live (mulai 2 hari lalu, selesai 5 hari lagi).
  const eventStart = new Date(now);
  eventStart.setDate(eventStart.getDate() - 2);
  const eventEnd = new Date(now);
  eventEnd.setDate(eventEnd.getDate() + 5);

  await prisma.patchEvent.create({
    data: {
      patchId: genshinPatchCurrent.id,
      title: "Event Login Harian: Hadiah Primogem",
      description: "Login setiap hari selama event untuk mengumpulkan primogem dan item langka",
      priceRupiah: 35000,
      startDate: eventStart,
      endDate: eventEnd,
    },
  });

  // Event yang belum mulai (tidak akan tampil ke customer sampai tanggalnya tiba).
  const upcomingEventStart = new Date(now);
  upcomingEventStart.setDate(upcomingEventStart.getDate() + 10);
  const upcomingEventEnd = new Date(upcomingEventStart);
  upcomingEventEnd.setDate(upcomingEventEnd.getDate() + 14);

  await prisma.patchEvent.create({
    data: {
      patchId: genshinPatchCurrent.id,
      title: "Event Boss Rush Musiman",
      description: "Farm boss rush untuk item exclusive musim ini",
      priceRupiah: 60000,
      startDate: upcomingEventStart,
      endDate: upcomingEventEnd,
    },
  });

  // ---------- Konten Endgame (contoh untuk Genshin) ----------
  const endgameDailyResin = await prisma.endgameContent.create({
    data: {
      gameId: genshin.id,
      title: "Habiskan Resin Harian",
      description: "Habiskan resin harian di domain/boss sesuai kebutuhan build",
      priceRupiah: 15000,
      resetCycle: "HARIAN",
      anchorStartDate: currentPatchStart,
    },
  });

  const endgameWeeklyBoss = await prisma.endgameContent.create({
    data: {
      gameId: genshin.id,
      title: "Farming Weekly Boss",
      description: "Farm seluruh weekly boss untuk material talent & weapon ascension",
      priceRupiah: 40000,
      resetCycle: "MINGGU_1",
      anchorStartDate: currentPatchStart,
    },
  });

  await prisma.endgameContent.create({
    data: {
      gameId: genshin.id,
      title: "Farming Bulanan: Trounce Domain",
      description: "Farm trounce domain untuk artifact set langka",
      priceRupiah: 65000,
      resetCycle: "BULAN_1",
      anchorStartDate: currentPatchStart,
    },
  });

  await prisma.endgameContent.create({
    data: {
      gameId: genshin.id,
      title: "Konten Endgame Musim Patch",
      description: "Konten endgame musiman yang tersedia sepanjang satu patch berjalan",
      priceRupiah: 55000,
      resetCycle: "PATCH_1",
      daysAfterPatchStart: 3,
    },
  });

  // ---------- Joki Item ----------
  const genshinAbyss = await prisma.jokiItem.create({
    data: {
      gameId: genshin.id,
      categoryId: genshinCatPushRank.id,
      title: "Push rank Spiral Abyss 12★",
      description: "Full clear 36 bintang, garansi selesai 1-2 hari",
      priceRupiah: 85000,
      etaLabel: "±1-2 hari",
      badge: "Populer",
    },
  });

  const genshinArtifact = await prisma.jokiItem.create({
    data: {
      gameId: genshin.id,
      categoryId: genshinCatEksplor.id,
      regionId: liyue.id,
      title: "Farm Artifact domain Liyue",
      description: "Farm domain sesuai build karakter pilihan di region Liyue",
      priceRupiah: 450,
      etaLabel: "±6 jam",
    },
  });

  const genshinDaily = await prisma.jokiItem.create({
    data: {
      gameId: genshin.id,
      categoryId: genshinCatDaily.id,
      title: "Daily commission harian",
      description: "30 hari daily commission + battle pass",
      priceRupiah: 120000,
      etaLabel: "±30 hari",
    },
  });

  // Rawat Akun biasa: mencakup konten endgame tertentu (weekly boss + resin harian) + event yang sedang berjalan.
  const genshinRawatAkunMingguan = await prisma.jokiItem.create({
    data: {
      gameId: genshin.id,
      categoryId: genshinCatRawatAkun.id,
      title: "Rawat Akun Mingguan",
      description: "Rawat akun mingguan mencakup farming weekly boss, habiskan resin harian, dan event yang sedang berjalan",
      priceRupiah: 90000,
      etaLabel: "±7 hari",
      includeEvent: true,
      durationDays: 7,
      endgameContent: {
        create: [{ endgameContentId: endgameWeeklyBoss.id }, { endgameContentId: endgameDailyResin.id }],
      },
    },
  });

  // Rawat Akun "1 patch": terikat ke Patch 5.5 (belum mulai), tampil ke customer
  // sejak Patch 5.5 dibuat, hilang H+1 setelah Patch 5.5 mulai berjalan.
  await prisma.jokiItem.create({
    data: {
      gameId: genshin.id,
      categoryId: genshinCatRawatAkun.id,
      title: "Rawat Akun 1 Patch — Patch 5.5",
      description: "Rawat akun penuh selama satu patch (Patch 5.5), termasuk seluruh konten yang muncul di patch tersebut",
      priceRupiah: 250000,
      etaLabel: "1 patch",
      badge: "Pre-order",
      isPatchWide: true,
      patchId: genshinPatchNext.id,
    },
  });

  await prisma.jokiItem.create({
    data: {
      gameId: genshin.id,
      categoryId: genshinCatQuest.id,
      questTypeId: genshinQuestArchon.id,
      regionId: mondstadt.id,
      title: "Kejar progress Archon Quest",
      description: "Selesaikan chapter Archon Quest terbaru",
      priceRupiah: 70000,
      etaLabel: "±1 hari",
      badge: "Baru",
      actNumber: 5,
    },
  });

  await prisma.jokiItem.create({
    data: {
      gameId: genshin.id,
      categoryId: genshinCatQuest.id,
      questTypeId: genshinQuestWorld.id,
      regionId: mondstadt.id,
      title: "World Quest region Mondstadt",
      description: "Selesaikan seluruh World Quest yang tersedia di Mondstadt",
      priceRupiah: 55000,
      etaLabel: "±8 jam",
    },
  });

  const genshinMondstadtExplore = await prisma.jokiItem.create({
    data: {
      gameId: genshin.id,
      categoryId: genshinCatEksplor.id,
      regionId: mondstadt.id,
      title: "Eksplorasi penuh Mondstadt",
      description: "Buka seluruh titik teleport, peti harta, dan puzzle di Mondstadt",
      priceRupiah: 500,
      etaLabel: "±10 jam",
    },
  });

  await prisma.jokiItem.create({
    data: {
      gameId: genshin.id,
      categoryId: genshinCatMaterial.id,
      title: "Crystalfly Mondstadt",
      description: "Farm Crystalfly untuk material furnishing Serenitea Pot",
      priceRupiah: 10000,
      unitQuantity: 100,
      etaLabel: "±3 jam",
    },
  });

  const wuwaTower = await prisma.jokiItem.create({
    data: {
      gameId: wuwa.id,
      categoryId: wuwaCatTower.id,
      title: "Push Tower of Adversity",
      description: "Clear seluruh floor musim berjalan",
      priceRupiah: 70000,
      etaLabel: "±1 hari",
      badge: "Populer",
    },
  });

  const wuwaEcho = await prisma.jokiItem.create({
    data: {
      gameId: wuwa.id,
      categoryId: wuwaCatEksplor.id,
      regionId: huaAo.id,
      title: "Farm Echo region Hua'ao",
      description: "Farm echo build sesuai resonator andalan di Hua'ao",
      priceRupiah: 500,
      etaLabel: "±10 jam",
    },
  });

  await prisma.jokiItem.create({
    data: {
      gameId: wuwa.id,
      categoryId: wuwaCatQuest.id,
      questTypeId: wuwaQuestExploration.id,
      regionId: rinascita.id,
      title: "Exploration Quest region Rinascita",
      description: "Selesaikan exploration quest yang tersedia di Rinascita",
      priceRupiah: 45000,
      etaLabel: "±6 jam",
    },
  });

  const nevernessStory = await prisma.jokiItem.create({
    data: {
      gameId: neverness.id,
      categoryId: nevernessCatQuest.id,
      questTypeId: nevernessQuestMain.id,
      title: "Story progression cepat",
      description: "Kejar progress cerita ke chapter terbaru",
      priceRupiah: 60000,
      etaLabel: "±1 hari",
      badge: "Baru",
    },
  });

  const nevernessFarm = await prisma.jokiItem.create({
    data: {
      gameId: neverness.id,
      categoryId: nevernessCatFarming.id,
      title: "Farm sumber daya harian",
      description: "Farm resource + event harian selama masa aktif",
      priceRupiah: 40000,
      etaLabel: "±6 jam",
    },
  });

  // ---------- Paket Joki (contoh untuk Genshin, region Mondstadt) ----------
  const genshinMondstadtWorldQuest = await prisma.jokiItem.findFirst({
    where: { gameId: genshin.id, questTypeId: genshinQuestWorld.id, regionId: mondstadt.id },
  });
  const genshinMondstadtArchonQuest = await prisma.jokiItem.findFirst({
    where: { gameId: genshin.id, questTypeId: genshinQuestArchon.id, regionId: mondstadt.id },
  });

  await prisma.jokiPaket.create({
    data: {
      gameId: genshin.id,
      title: "Paket Lengkap Mondstadt",
      description: "Paket eksplorasi penuh + World Quest + Archon Quest region Mondstadt dalam satu harga",
      priceRupiah: 165000,
      regionId: mondstadt.id,
      isAllMapRegion: false,
      items: {
        create: [
          { jokiItemId: genshinMondstadtExplore.id },
          ...(genshinMondstadtWorldQuest ? [{ jokiItemId: genshinMondstadtWorldQuest.id }] : []),
          ...(genshinMondstadtArchonQuest ? [{ jokiItemId: genshinMondstadtArchonQuest.id }] : []),
        ],
      },
    },
  });

  // ---------- Customer ----------
  // "Rafi A." sengaja dibuat sebagai contoh customer dengan order LINTAS game
  // (Genshin + Wuthering Waves) untuk mendemokan pengelompokan order per
  // Customer di /admin/customer, dan halaman publik /progress/rafi-demo.
  const customerRafi = await prisma.customer.create({
    data: { name: "Rafi A.", publicSlug: "rafi-demo" },
  });
  const customerDimas = await prisma.customer.create({
    data: { name: "Dimas P.", publicSlug: "dimas-demo" },
  });
  const customerWulan = await prisma.customer.create({
    data: { name: "Wulan S.", publicSlug: "wulan-demo" },
  });
  const customerHana = await prisma.customer.create({
    data: { name: "Hana K.", publicSlug: "hana-demo" },
  });
  const customerYoga = await prisma.customer.create({
    data: { name: "Yoga R.", publicSlug: "yoga-demo" },
  });
  const customerCitra = await prisma.customer.create({
    data: { name: "Citra M.", publicSlug: "citra-demo" },
  });
  const customerAndra = await prisma.customer.create({
    data: { name: "Andra F.", publicSlug: "andra-demo" },
  });
  const customerSalsa = await prisma.customer.create({
    data: { name: "Salsa D.", publicSlug: "salsa-demo" },
  });

  // ---------- Order (antrian aktif) ----------
  const orderRafiAbyss = await prisma.order.create({
    data: {
      orderCode: "ECL-2291",
      gameId: genshin.id,
      customerId: customerRafi.id,
      jokerName: "Nayla",
      status: "DIKERJAKAN",
      progressPct: 72,
      estimasiJoki: "1-2 hari",
      totalPrice: genshinAbyss.priceRupiah,
      orderSource: "DISCORD",
      sourceUsername: "rafi.a",
      lines: {
        create: [{ jokiItemId: genshinAbyss.id, calculatedPrice: genshinAbyss.priceRupiah }],
      },
    },
    include: { lines: true },
  });

  // Contoh riwayat update progres untuk item Push Rank (bukan Rawat Akun
  // reset-harian) -> pakai screenshotUrl sebagai bukti progres.
  await prisma.orderLineUpdate.create({
    data: {
      orderLineId: orderRafiAbyss.lines[0].id,
      note: "Sudah floor 11, lanjut floor 12 besok",
      screenshotUrl: "https://i.imgur.com/example-floor11.png",
    },
  });
  await prisma.orderLineUpdate.create({
    data: {
      orderLineId: orderRafiAbyss.lines[0].id,
      note: "Floor 12 chamber 2 selesai, tinggal chamber 3",
    },
  });

  // Order kedua Rafi A. -- game berbeda (Wuthering Waves), tetap 1 Customer
  // yang sama, tapi Order & progress terpisah.
  await prisma.order.create({
    data: {
      orderCode: "ECL-2287",
      gameId: wuwa.id,
      customerId: customerRafi.id,
      jokerName: "Bagas",
      status: "MENUNGGU",
      progressPct: 0,
      estimasiJoki: "±1 hari",
      totalPrice: wuwaTower.priceRupiah,
      orderSource: "DISCORD",
      sourceUsername: "rafi.a",
      lines: {
        create: [{ jokiItemId: wuwaTower.id, calculatedPrice: wuwaTower.priceRupiah }],
      },
    },
  });

  // Order ketiga Rafi A. -- Rawat Akun Mingguan Genshin, mendemokan input
  // "dihabiskan di mana" untuk konten reset harian (resin).
  const orderRafiRawatAkun = await prisma.order.create({
    data: {
      orderCode: "ECL-2290",
      gameId: genshin.id,
      customerId: customerRafi.id,
      jokerName: "Nayla",
      status: "DIKERJAKAN",
      progressPct: 40,
      estimasiJoki: "±7 hari",
      totalPrice: genshinRawatAkunMingguan.priceRupiah,
      orderSource: "DISCORD",
      sourceUsername: "rafi.a",
      lines: {
        create: [
          {
            jokiItemId: genshinRawatAkunMingguan.id,
            rawatAkunQuantity: 1,
            calculatedPrice: genshinRawatAkunMingguan.priceRupiah,
            startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
    include: { lines: true },
  });

  await prisma.orderLineUpdate.create({
    data: {
      orderLineId: orderRafiRawatAkun.lines[0].id,
      note: "Resin hari ke-1 sudah dihabiskan",
      resetLocation: "Domain Cecilia Garden (talent) + Weekly boss Andrius",
    },
  });
  await prisma.orderLineUpdate.create({
    data: {
      orderLineId: orderRafiRawatAkun.lines[0].id,
      note: "Resin hari ke-2 sudah dihabiskan",
      resetLocation: "Domain Forsaken Rift (weapon ascension)",
    },
  });

  await prisma.order.create({
    data: {
      orderCode: "ECL-2288",
      gameId: wuwa.id,
      customerId: customerDimas.id,
      jokerName: "Bagas",
      status: "DIKERJAKAN",
      progressPct: 30,
      estimasiJoki: "1 hari",
      totalPrice: wuwaTower.priceRupiah,
      orderSource: "WHATSAPP",
      sourceUsername: "Dimas P.",
      sourceWhatsapp: "081234567890",
      lines: {
        create: [{ jokiItemId: wuwaTower.id, calculatedPrice: wuwaTower.priceRupiah }],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderCode: "ECL-2295",
      gameId: neverness.id,
      customerId: customerWulan.id,
      jokerName: null,
      status: "MENUNGGU",
      progressPct: 5,
      estimasiJoki: "±1 hari",
      totalPrice: nevernessStory.priceRupiah * 2, // Act 1-2
      orderSource: "INSTAGRAM",
      sourceUsername: "@wulan.s",
      lines: {
        create: [
          {
            jokiItemId: nevernessStory.id,
            actFrom: 1,
            actTo: 2,
            calculatedPrice: nevernessStory.priceRupiah * 2,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderCode: "ECL-2286",
      gameId: genshin.id,
      customerId: customerHana.id,
      jokerName: "Nayla",
      status: "FINISHING",
      progressPct: 95,
      estimasiJoki: "±6 jam",
      totalPrice: Math.round((100 - 40) * genshinArtifact.priceRupiah),
      orderSource: "TIKTOK",
      sourceUsername: "@hana.k",
      lines: {
        create: [
          {
            jokiItemId: genshinArtifact.id,
            explorationPercent: 40,
            calculatedPrice: Math.round((100 - 40) * genshinArtifact.priceRupiah),
          },
        ],
      },
    },
  });

  // ---------- History + Testimoni ----------
  const historyData = [
    {
      orderCode: "ECL-2201",
      gameId: genshin.id,
      jokiItemId: genshinAbyss.id,
      lineExtra: {},
      price: genshinAbyss.priceRupiah,
      customerId: customerYoga.id,
      customerDisplayName: "Yoga R.",
      jokerName: "Nayla",
      orderSource: "DISCORD" as const,
      sourceUsername: "yoga.r",
      sourceWhatsapp: null as string | null,
      daysAgo: 5,
      rating: 5,
      message: "Prosesnya rapi, ada update progress terus. Selesai lebih cepat dari estimasi.",
    },
    {
      orderCode: "ECL-2198",
      gameId: wuwa.id,
      jokiItemId: wuwaEcho.id,
      lineExtra: { explorationPercent: 20 },
      price: Math.round((100 - 20) * wuwaEcho.priceRupiah),
      customerId: customerCitra.id,
      customerDisplayName: "Citra M.",
      jokerName: "Bagas",
      orderSource: "WHATSAPP" as const,
      sourceUsername: "Citra M.",
      sourceWhatsapp: "081298765432",
      daysAgo: 6,
      rating: 5,
      message: "Joki-nya komunikatif, akun aman, hasil farming sesuai target.",
    },
    {
      orderCode: "ECL-2190",
      gameId: neverness.id,
      jokiItemId: nevernessFarm.id,
      lineExtra: {},
      price: nevernessFarm.priceRupiah,
      customerId: customerAndra.id,
      customerDisplayName: "Andra F.",
      jokerName: "Bagas",
      orderSource: "TIKTOK" as const,
      sourceUsername: "@andra.f",
      sourceWhatsapp: null as string | null,
      daysAgo: 8,
      rating: 4,
      message: "Baru coba karena game-nya masih baru, ternyata pengerjaan tetap teliti.",
    },
    {
      orderCode: "ECL-2184",
      gameId: genshin.id,
      jokiItemId: genshinDaily.id,
      lineExtra: {},
      price: genshinDaily.priceRupiah,
      customerId: customerSalsa.id,
      customerDisplayName: "Salsa D.",
      jokerName: "Nayla",
      orderSource: "INSTAGRAM" as const,
      sourceUsername: "@salsa.d",
      sourceWhatsapp: null as string | null,
      daysAgo: 11,
      rating: 5,
      message: "Udah langganan tiap event, hasilnya selalu konsisten bagus.",
    },
  ];

  for (const h of historyData) {
    const completedAt = new Date();
    completedAt.setDate(completedAt.getDate() - h.daysAgo);

    const order = await prisma.order.create({
      data: {
        orderCode: h.orderCode,
        gameId: h.gameId,
        customerId: h.customerId,
        jokerName: h.jokerName,
        status: "SELESAI",
        progressPct: 100,
        totalPrice: h.price,
        orderSource: h.orderSource,
        sourceUsername: h.sourceUsername,
        sourceWhatsapp: h.sourceWhatsapp,
        completedAt,
        createdAt: completedAt,
        lines: {
          create: [{ jokiItemId: h.jokiItemId, calculatedPrice: h.price, ...h.lineExtra }],
        },
      },
    });

    await prisma.testimonial.create({
      data: {
        gameId: h.gameId,
        orderId: order.id,
        customerName: h.customerDisplayName,
        rating: h.rating,
        message: h.message,
        createdAt: completedAt,
      },
    });
  }

  await prisma.jokiHistoryEntry.create({
    data: {
      gameId: genshin.id,
      title: "Rawat Akun Bulanan (transaksi lama, dicatat manual)",
      customerName: "Bimo S.",
      jokerName: "Dimas",
      completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      rating: 5,
      note: "Rawat akun sebulan penuh, semua daily commission & weekly boss aman, tidak ada kendala.",
      screenshotUrls: [],
    },
  });

  console.log("Seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
