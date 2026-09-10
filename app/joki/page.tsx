import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { FilterChips } from "@/components/FilterChips";
import { JokiListFilter, type JokiDisplayCard } from "@/components/JokiListFilter";
import { isPatchEventLive, isPatchWideRawatAkunLive } from "@/lib/patch-schedule";
import { formatRupiah } from "@/lib/format";

export const revalidate = 60;

const VALID_SLUGS = ["genshin", "wuwa", "neverness"] as const;
type ValidSlug = (typeof VALID_SLUGS)[number];

function isValidSlug(value: string | undefined): value is ValidSlug {
  return !!value && (VALID_SLUGS as readonly string[]).includes(value);
}

type DisplayCard = JokiDisplayCard;

export default async function JokiListPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game: gameSlugRaw } = await searchParams;
  const gameSlug = isValidSlug(gameSlugRaw) ? gameSlugRaw : undefined;
  const active = gameSlug ?? "all";
  const now = new Date();

  const games = await prisma.game.findMany({ orderBy: { createdAt: "asc" } });

  const [regularItems, patches, patchWideItems, pakets] = await Promise.all([
    prisma.jokiItem.findMany({
      where: {
        isActive: true,
        isPatchWide: false,
        ...(gameSlug ? { game: { slug: gameSlug } } : {}),
      },
      include: {
        game: true,
        category: true,
        region: true,
        questType: true,
        endgameContent: { include: { endgameContent: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.patch.findMany({
      where: gameSlug ? { game: { slug: gameSlug } } : {},
      include: { game: true, events: true },
    }),
    prisma.jokiItem.findMany({
      where: {
        isActive: true,
        isPatchWide: true,
        ...(gameSlug ? { game: { slug: gameSlug } } : {}),
      },
      include: { game: true, category: true, patch: true },
    }),
    prisma.jokiPaket.findMany({
      where: {
        isActive: true,
        ...(gameSlug ? { game: { slug: gameSlug } } : {}),
      },
      include: { game: true, region: true, items: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Cek per game apakah sedang ada patch berjalan dengan event live, supaya
  // toggle includeEvent pada Joki Item Rawat Akun bisa ditandai relevan.
  const gameIdsWithLiveEvent = new Set(
    patches
      .filter((p) => p.events.some((ev) => isPatchEventLive(ev, now)))
      .map((p) => p.gameId)
  );

  // Joki Item biasa (bukan event, bukan rawat akun 1-patch).
  const cards: DisplayCard[] = regularItems.map((item) => {
    const endgameNames = item.endgameContent.map((e) => e.endgameContent.title);
    const includeEventTag =
      item.includeEvent && gameIdsWithLiveEvent.has(item.gameId) ? "termasuk event" : null;
    const actTag = item.questType && item.actNumber ? `Act ${item.actNumber}` : null;
    const priceLabel =
      item.category.isMaterial && item.unitQuantity
        ? `${formatRupiah(item.priceRupiah)} / ${item.unitQuantity}`
        : item.category.requiresQuestType
          ? `${formatRupiah(item.priceRupiah)} / bagian`
          : item.category.requiresRegion
            ? `${formatRupiah(item.priceRupiah)} / persen`
            : formatRupiah(item.priceRupiah);
    return {
      key: `item-${item.id}`,
      title: item.title,
      description: item.description,
      priceLabel,
      etaLabel: item.etaLabel,
      badge: item.badge,
      game: item.game,
      categoryName: item.category.name,
      metaTags: [
        item.category.name,
        item.questType?.name,
        actTag,
        item.region?.name,
        ...endgameNames,
        includeEventTag,
      ],
    };
  });

  // PatchEvent yang sedang live -> tampil sebagai kategori "Event".
  for (const patch of patches) {
    for (const event of patch.events) {
      if (isPatchEventLive(event, now)) {
        cards.push({
          key: `event-${event.id}`,
          title: event.title,
          description: event.description,
          priceLabel: formatRupiah(event.priceRupiah),
          etaLabel: `s.d. ${event.endDate.toLocaleDateString("id-ID")}`,
          badge: "Event",
          game: patch.game,
          categoryName: "Event",
          metaTags: ["Event", patch.name],
        });
      }
    }
  }

  // Joki Item Rawat Akun "1 patch" yang sedang eligible (tampil sejak patch
  // dibuat, hilang H+1 setelah patch.startDate terlewati).
  for (const item of patchWideItems) {
    if (item.patch && isPatchWideRawatAkunLive(item.patch, now)) {
      cards.push({
        key: `rawatakun-${item.id}`,
        title: item.title,
        description: item.description,
        priceLabel: formatRupiah(item.priceRupiah),
        etaLabel: item.etaLabel,
        badge: item.badge ?? "Rawat Akun",
        game: item.game,
        categoryName: item.category.name,
        metaTags: [item.category.name, item.patch.name],
      });
    }
  }

  // Paket Joki.
  for (const paket of pakets) {
    const paketMetaTags = ["Paket", `${paket.items.length} item`];
    if (paket.region) {
      paketMetaTags.push(paket.region.name);
      if (paket.isAllMapRegion) paketMetaTags.push("All Map");
    }
    cards.push({
      key: `paket-${paket.id}`,
      title: paket.title,
      description: paket.description,
      priceLabel: formatRupiah(paket.priceRupiah),
      etaLabel: "sesuai isi paket",
      badge: "Paket",
      game: paket.game,
      categoryName: "Paket",
      metaTags: paketMetaTags,
    });
  }

  cards.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

  return (
    <div className="min-h-screen relative">
      <div className="shihu-glow-top" />
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pb-20 pt-8 relative z-10">
        <SectionHeading
          eyebrow="Katalog layanan"
          title="List joki"
          desc="Pilih paket sesuai kebutuhan. Harga dan estimasi waktu sudah ditampilkan di setiap paket."
        />

        <FilterChips games={games} active={active} />

        {cards.length === 0 ? (
          <EmptyState />
        ) : (
          <JokiListFilter cards={cards} />
        )}
      </main>

      <Footer />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
      <p className="font-display font-semibold mb-1.5">Belum ada paket untuk game ini</p>
      <p className="text-shihu-muted text-sm">
        Coba pilih game lain atau kembali lagi nanti.
      </p>
    </div>
  );
}
