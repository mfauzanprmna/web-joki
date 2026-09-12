import { prisma } from "./prisma";
import { computeRawatAkunPeriod, buildAutoTasks, enumerateDays, isoDay, startOfDay } from "./rawat-akun-schedule";

/**
 * Memastikan OrderLineDayProgress (satu baris per tanggal) dan
 * OrderLineDayTask (task otomatis dari konten endgame/event) sudah ada untuk
 * sebuah OrderLine Rawat Akun, berdasarkan rentang OrderLine.startDate..endDate
 * yang tersimpan. Idempotent -- aman dipanggil berulang kali (mis. tiap kali
 * halaman progress admin dibuka); tidak menimpa data yang sudah ada.
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
}