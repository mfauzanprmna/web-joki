import { getContactLinks } from "@/lib/settings";
import { ContactIcon } from "@/components/ContactIcon";

/**
 * Footer semua halaman customer. Async server component: daftar kontak
 * diambil dari database (dikelola admin lewat /admin/setting), jadi
 * pemakaiannya tetap `<Footer />` biasa di setiap page.
 */
export async function Footer() {
  // Footer ada di SEMUA halaman customer -- kalau pengambilan kontak gagal
  // (mis. database sedang bermasalah), halaman tetap harus tampil, cuma
  // tanpa blok kontak. Errornya tetap dicatat supaya tidak tersembunyi.
  let links: Awaited<ReturnType<typeof getContactLinks>> = [];
  try {
    links = await getContactLinks();
  } catch (err) {
    console.error("Footer: gagal mengambil daftar kontak:", err);
  }

  return (
    <footer className="border-t border-shihu-border relative z-10">
      <div className="site-container py-7 text-center">
        {links.length > 0 && (
          <div className="mb-5">
            <p className="text-shihu-muted text-xs font-display font-semibold mb-3">Hubungi kami</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {links.map((link) => {
                const isWebLink = link.url.startsWith("http");
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    {...(isWebLink ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-shihu-border bg-shihu-card text-xs font-display font-medium text-shihu-muted hover:text-shihu-corona hover:border-shihu-corona/40 transition-colors"
                  >
                    <ContactIcon icon={link.icon} logoUrl={link.logoUrl} size={15} />
                    {link.name}
                  </a>
                );
              })}
            </div>
          </div>
        )}
        <p className="text-shihu-faint text-xs">
          Shihu Service — layanan joki game terpercaya. Genshin Impact ·
          Wuthering Waves · Neverness to Everness.
        </p>
      </div>
    </footer>
  );
}
