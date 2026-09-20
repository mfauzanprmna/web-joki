import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JokiCategoryTabs, type JokiDisplayCard } from "@/components/JokiCategoryTabs";
import { isPatchEventLive, isPatchWideRawatAkunLive } from "@/lib/patch-schedule";
import { formatRupiah } from "@/lib/format";
import type { GameSlug } from "@/types/game";

export const revalidate = 60;

const VALID_SLUGS = ["genshin", "wuwa", "neverness"] as const;

function isValidSlug(value: string): value is GameSlug {
  return (VALID_SLUGS as readonly string[]).includes(value);
}

const BG_GRADIENT: Record<string, string> = {
  genshin: "linear-gradient(160deg, #173c68 0%, #0b1829 75%)",
  wuwa: "linear-gradient(160deg, #124d68 0%, #0b1829 75%)",
  neverness: "linear-gradient(160deg, #293b74 0%, #0b1829 75%)",
};

type DisplayCard = JokiDisplayCard;

/**
 * Halaman "toko" satu game, gaya web top-up: banner game di atas, lalu tab
 * kategori (Paket, tiap kategori Joki Item, Event, Endgame) dengan semua
 * layanan game itu tampil di satu halaman -- tanpa perlu pilih game lagi
 * (game sudah ditentukan lewat URL /[slug]).
 */
export default async function GameJokiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();

  const gameSlug = slug;
  const now = new Date();

  const game = await prisma.game.findUnique({ where: { slug: gameSlug } });
  if (!game) notFound();

  const [regularItems, patches, patchWideItems, pakets, endgameContents] = await Promise.all([
    prisma.jokiItem.findMany({
      where: { isActive: true, isPatchWide: false, game: { slug: gameSlug } },
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
      where: { game: { slug: gameSlug } },
      include: { game: true, events: true },
    }),
    prisma.jokiItem.findMany({
      where: { isActive: true, isPatchWide: true, game: { slug: gameSlug } },
      include: { game: true, category: true, region: true, questType: true, patch: true },
    }),
    prisma.jokiPaket.findMany({
      where: { isActive: true, game: { slug: gameSlug } },
      include: { game: true, region: true, items: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.endgameContent.findMany({
      where: { isActive: true, isOrderable: true, game: { slug: gameSlug } },
      include: { game: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Cek apakah sedang ada patch berjalan dengan event live, supaya toggle
  // includeEvent pada Joki Item Rawat Akun bisa ditandai relevan.
  const hasLiveEvent = patches.some((p) => p.events.some((ev) => isPatchEventLive(ev, now)));

  // Joki Item biasa (bukan event, bukan rawat akun 1-patch).
  const cards: DisplayCard[] = regularItems.map((item) => {
    const endgameNames = item.endgameContent.map((e) => e.endgameContent.title);
    const includeEventTag = item.includeEvent && hasLiveEvent ? "termasuk event" : null;
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
      regionName: item.region?.name,
      questTypeName: item.questType?.name,
      supportsRegionFilter: item.category.requiresRegion || item.category.requiresQuestType,
      supportsQuestTypeFilter: item.category.requiresQuestType,
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

  // Joki Item Rawat Akun "1 patch" yang sedang eligible.
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
        regionName: item.region?.name,
        questTypeName: item.questType?.name,
        supportsRegionFilter: item.category.requiresRegion || item.category.requiresQuestType,
        supportsQuestTypeFilter: item.category.requiresQuestType,
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
      regionName: paket.region?.name,
      supportsRegionFilter: !!paket.region,
      metaTags: paketMetaTags,
    });
  }

  // Konten endgame yang diaktifkan admin untuk dijual langsung.
  for (const content of endgameContents) {
    cards.push({
      key: `endgame-${content.id}`,
      title: content.title,
      description: content.description,
      priceLabel: formatRupiah(content.priceRupiah),
      etaLabel: "sesuai siklus reset",
      badge: "Endgame",
      game: content.game,
      categoryName: "Endgame",
      metaTags: ["Endgame"],
    });
  }

  const fallbackGradient = BG_GRADIENT[game.slug] ?? BG_GRADIENT.genshin;

  return (
    <div className="min-h-screen relative">
      <div className="shihu-glow-top" />
      <Navbar />

      <main className="relative z-10 pb-20">
        {/* Header/banner game -- gambar/tagline di atas, gaya web top-up. */}
        <section
          className="relative min-h-[220px] sm:min-h-[260px] flex items-end border-b border-shihu-border overflow-hidden"
          style={{ borderColor: `${game.accentColor}2E` }}
        >
          <div
            className="absolute inset-0 bg-cover bg-top"
            style={{
              backgroundImage: game.bannerImage ? `url(${game.bannerImage})` : fallbackGradient,
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, #07111f 0%, rgba(7,17,31,0.9) 40%, rgba(7,17,31,0.35) 80%, rgba(7,17,31,0.15) 100%)",
            }}
            aria-hidden="true"
          />
          <div className="site-container relative py-7 sm:py-9">
            <p
              className="text-xs sm:text-sm font-medium font-display mb-1.5"
              style={{ color: game.accentColor }}
            >
              {game.tagline}
            </p>
            <h1 className="font-display text-2xl sm:text-4xl font-bold">{game.name}</h1>
          </div>
        </section>

        <div className="site-container pt-8">
          {cards.length === 0 ? (
            <EmptyState />
          ) : (
            <JokiCategoryTabs cards={cards} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
      <p className="font-display font-semibold mb-1.5">Belum ada layanan untuk game ini</p>
      <p className="text-shihu-muted text-sm">Coba pilih game lain atau kembali lagi nanti.</p>
    </div>
  );
}
