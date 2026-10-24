import type { OrderStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { computeRawatAkunPeriod, buildAutoTasks, enumerateDays, isoDay, startOfDay } from "./rawat-akun-schedule";

/**
 * Memastikan OrderLineDayProgress (satu baris per tanggal) dan
 * OrderLineDayTask (task otomatis dari konten endgame/event) sudah ada untuk
 * sebuah OrderLine Rawat Akun, berdasarkan rentang OrderLine.startDate..endDate
 * yang tersimpan. Idempotent -- aman dipanggil berulang kali.
 *
 * OPTIMASI: proses ini cukup berat (beberapa query tambahan + loop
 * update/delete per event), padahal hasilnya nyaris selalu sama setelah
 * sinkronisasi pertama (baris day progress/day task sudah pasti ada, admin
 * update via form terpisah, bukan lewat fungsi ini). Jadi begitu berhasil
 * jalan sekali, kita catat di OrderLine.scheduleSyncedAt dan skip proses
 * berat ini di pemanggilan berikutnya -- penting karena fungsi ini dipanggil
 * dari Server Component di halaman yang sering di-refresh (progress
 * customer, admin, worker).
 *
 * Dipanggil dari Server Component (bukan dari client), sebelum data
 * OrderLineDayProgress/OrderLineDayTask dibaca untuk ditampilkan.
 */
export async function ensureRawatAkunScheduleSynced(orderLineId: string): Promise<void> {
  const line = await prisma.orderLine.findUnique({
    where: { id: orderLineId },
    include: {
      jokiItem: {
        include: {
          category: { select: { isRawatAkun: true } },
          patch: { select: { id: true, startDate: true, endDate: true, gameId: true } },
          endgameContent: { include: { endgameContent: true } },
        },
      },
    },
  });

  if (!line || !line.jokiItem || !line.jokiItem.category.isRawatAkun) return;
  if (!line.startDate || !line.endDate) return;
  if (line.scheduleSyncedAt) return;

  const period = { startDate: startOfDay(line.startDate), endDate: startOfDay(line.endDate) };

  // Pastikan baris OrderLineDayProgress ada untuk tiap tanggal dalam periode.
  const days = enumerateDays(period.startDate, period.endDate);
  await prisma.orderLineDayProgress.createMany({
    data: days.map((date) => ({ orderLineId, date, percent: 0 })),
    skipDuplicates: true,
  });

  // Ambil patch & event game ini untuk menghitung task otomatis (konten
  // endgame PATCH_1, dan event kalau includeEvent aktif).
  const patches = await prisma.patch.findMany({
    where: { gameId: line.jokiItem.gameId },
    select: { id: true, startDate: true, endDate: true },
  });
  const events = line.jokiItem.includeEvent
    ? await prisma.patchEvent.findMany({
      where: { patch: { gameId: line.jokiItem.gameId } },
      select: { id: true, title: true, startDate: true, endDate: true },
    })
    : [];

  // Joki Item "1 Patch" (isPatchWide) sengaja TIDAK punya pilihan konten
  // endgame manual di form (lihat JokiItemFormFields) -- otomatis mencakup
  // SEMUA konten endgame milik game tsb. Selain itu (Rawat Akun biasa),
  // pakai konten endgame yang dipilih manual admin lewat endgameContent.
  const endgameContents = line.jokiItem.isPatchWide
    ? await prisma.endgameContent.findMany({ where: { gameId: line.jokiItem.gameId, isActive: true } })
    : line.jokiItem.endgameContent.map((e) => e.endgameContent);

  const selectedPatchId = line.jokiItem.patch?.id;
  const schedulePatches = line.jokiItem.isPatchWide && selectedPatchId
    ? patches.filter((patch) => patch.id === selectedPatchId)
    : patches;

  const autoTasks = buildAutoTasks(
    period,
    endgameContents,
    schedulePatches,
    events,
    line.jokiItem.includeEvent
  );

  for (const event of events) {
    const legacySourceKey = `event:${event.id}:`;
    const sourceKey = `event:${event.id}`;
    const eventTasks = await prisma.orderLineDayTask.findMany({
      where: {
        orderLineId,
        category: "Event",
        OR: [
          { sourceKey },
          { sourceKey: { startsWith: legacySourceKey } },
        ],
      },
      select: { id: true, date: true, status: true, note: true, sourceKey: true },
    });
    const statusRank = { BELUM: 0, SEDANG: 1, SELESAI: 2 } as const;
    const tasksByDate = new Map<string, typeof eventTasks>();
    for (const task of eventTasks) {
      const dateKey = isoDay(task.date);
      const tasks = tasksByDate.get(dateKey) ?? [];
      tasks.push(task);
      tasksByDate.set(dateKey, tasks);
    }

    for (const tasks of tasksByDate.values()) {
      const keeper = tasks.reduce((current, task) =>
        statusRank[task.status] > statusRank[current.status] ? task : current
      );
      const duplicateIds = tasks.filter((task) => task.id !== keeper.id).map((task) => task.id);
      if (duplicateIds.length > 0) {
        await prisma.orderLineDayTask.deleteMany({ where: { id: { in: duplicateIds } } });
      }
      await prisma.orderLineDayTask.update({
        where: { id: keeper.id },
        data: {
          sourceKey,
          status: keeper.status,
          note: keeper.note ?? tasks.find((task) => task.note)?.note ?? null,
        },
      });
    }
  }

  if (autoTasks.length > 0) {
    await prisma.orderLineDayTask.createMany({
      data: autoTasks.map((t) => ({
        orderLineId,
        date: t.date,
        category: t.category,
        label: t.label,
        sourceKey: t.sourceKey,
      })),
      skipDuplicates: true,
    });
  }

  const syncedTasks = await prisma.orderLineDayTask.findMany({
    where: { orderLineId, sourceKey: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, date: true, category: true, label: true, status: true, note: true, createdAt: true },
  });
  const statusRank = { BELUM: 0, SEDANG: 1, SELESAI: 2 } as const;
  const taskGroups = new Map<string, typeof syncedTasks>();
  for (const task of syncedTasks) {
    const key = `${isoDay(task.date)}:${task.category}:${task.label}`;
    const group = taskGroups.get(key) ?? [];
    group.push(task);
    taskGroups.set(key, group);
  }

  for (const group of taskGroups.values()) {
    if (group.length < 2) continue;
    const keeper = group.reduce((current, task) => {
      if (statusRank[task.status] > statusRank[current.status]) return task;
      if (statusRank[task.status] < statusRank[current.status]) return current;
      return task.createdAt > current.createdAt ? task : current;
    });
    const duplicateIds = group.filter((task) => task.id !== keeper.id).map((task) => task.id);
    await prisma.orderLineDayTask.update({
      where: { id: keeper.id },
      data: {
        status: keeper.status,
        note: keeper.note ?? group.find((task) => task.note)?.note ?? null,
      },
    });
    await prisma.orderLineDayTask.deleteMany({ where: { id: { in: duplicateIds } } });
  }

  // Tandai baris ini sudah disinkronkan, supaya pemanggilan berikutnya
  // (page load selanjutnya) langsung skip di awal fungsi (lihat guard di
  // atas) -- ini inti optimasinya.
  await prisma.orderLine.update({
    where: { id: orderLineId },
    data: { scheduleSyncedAt: new Date() },
  });
}


const ACTIVE_ORDER_STATUSES: OrderStatus[] = ["MENUNGGU", "DIKERJAKAN", "FINISHING"];
const DAY_MS = 24 * 60 * 60 * 1000;
// Batas sinkron paralel -- tiap sinkron menjalankan beberapa query, jadi
// jangan semua baris sekaligus supaya connection pool database tidak habis.
const RESYNC_CONCURRENCY = 5;

/**
 * Dipanggil saat sebuah PatchEvent DITAMBAH atau tanggalnya DIUBAH (lihat
 * createPatchEvent/updatePatchEvent di lib/actions/patch.ts), supaya event
 * tsb langsung masuk ke checklist order Rawat Akun yang SUDAH berjalan.
 *
 * Kenapa perlu: ensureRawatAkunScheduleSynced di atas sengaja cuma jalan
 * sekali per baris (guard scheduleSyncedAt, demi performa), jadi event yang
 * baru dibuat setelah itu tidak akan pernah ikut masuk ke baris yang sudah
 * tersinkron. Fungsi ini mereset guard-nya KHUSUS untuk baris yang relevan
 * lalu menyinkronkannya ulang. Sinkron ulang itu idempotent: cuma
 * menambah task yang belum ada -- status/catatan task yang sudah ada TIDAK
 * berubah.
 *
 * Baris yang diproses (semua syarat harus terpenuhi):
 *  - Joki Item-nya kategori Rawat Akun, includeEvent aktif, game yang sama
 *    dengan event.
 *  - Periode baris (startDate..endDate) overlap dengan tanggal event.
 *  - Order-nya masih aktif (MENUNGGU/DIKERJAKAN/FINISHING) dan barisnya
 *    belum ditandai selesai -- order yang sudah selesai tidak diutak-atik
 *    supaya riwayatnya tidak tiba-tiba punya task baru yang kosong.
 *  - Baris yang BELUM pernah tersinkron dilewati: begitu pertama kali
 *    dibuka, sinkron pertamanya otomatis sudah memuat event ini.
 *
 * Rentang tanggal dilebarkan 1 hari di kedua sisi karena penyimpanan
 * tanggal & perbandingan hari di sync memakai potongan jam yang berbeda --
 * kelebihan pilih cuma berarti satu sinkron ulang yang tidak mengubah apa
 * pun, sedangkan kekurangan pilih berarti event terlewat.
 *
 * Reset guard dilakukan LEBIH DULU untuk semua baris (satu query) sebelum
 * sinkron langsung dijalankan: kalau sinkron langsungnya gagal/timeout,
 * baris tetap akan disinkronkan lagi otomatis saat halamannya dibuka
 * berikutnya. Return: jumlah baris yang diproses.
 */
export async function syncRawatAkunLinesForEventChange(params: {
  gameId: string;
  from: Date;
  to: Date;
}): Promise<number> {
  const windowStart = new Date(params.from.getTime() - DAY_MS);
  const windowEnd = new Date(params.to.getTime() + DAY_MS);

  const lines = await prisma.orderLine.findMany({
    where: {
      isCompleted: false,
      scheduleSyncedAt: { not: null },
      startDate: { lte: windowEnd },
      endDate: { gte: windowStart },
      order: { status: { in: ACTIVE_ORDER_STATUSES } },
      jokiItem: {
        gameId: params.gameId,
        includeEvent: true,
        category: { isRawatAkun: true },
      },
    },
    select: { id: true },
  });

  if (lines.length === 0) return 0;
  const ids = lines.map((l) => l.id);

  await prisma.orderLine.updateMany({
    where: { id: { in: ids } },
    data: { scheduleSyncedAt: null },
  });

  for (let i = 0; i < ids.length; i += RESYNC_CONCURRENCY) {
    const chunk = ids.slice(i, i + RESYNC_CONCURRENCY);
    await Promise.all(
      chunk.map(async (id) => {
        try {
          await ensureRawatAkunScheduleSynced(id);
        } catch (err) {
          // Tidak dilempar: guard sudah direset di atas, jadi baris ini
          // tetap akan dicoba lagi otomatis di kunjungan halaman berikutnya.
          console.error(`Gagal sinkron ulang Rawat Akun untuk baris ${id}:`, err);
        }
      }),
    );
  }

  return ids.length;
}
