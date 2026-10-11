import { getContactLinks, getWorkerCommissionPercent } from "@/lib/settings";
import { WorkerCommissionForm } from "@/components/admin/WorkerCommissionForm";
import { CreateContactLinkForm } from "@/components/admin/CreateContactLinkForm";
import { ContactLinkRowItem } from "@/components/admin/ContactLinkRowItem";

export default async function AdminSettingPage() {
  const [commissionPercent, contacts] = await Promise.all([
    getWorkerCommissionPercent(),
    getContactLinks(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Setting</h1>
      <p className="text-shihu-muted text-sm mb-8">
        Pengaturan umum situs: kontak yang tampil di footer halaman customer, dan komisi worker.
      </p>

      <section className="mb-10">
        <h2 className="font-display text-base font-semibold mb-1">Komisi worker</h2>
        <p className="text-shihu-muted text-xs mb-4">
          Persentase dari harga tiap pesanan yang jadi komisi worker. Dihitung langsung saat ditampilkan (tidak
          disimpan per pesanan), jadi mengubah angka ini ikut mengubah tampilan komisi di semua pesanan —
          termasuk yang sudah selesai.
        </p>
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
          <WorkerCommissionForm currentPercent={commissionPercent} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-base font-semibold mb-1">Kontak</h2>
        <p className="text-shihu-muted text-xs mb-4">
          Tampil sebagai tombol di footer semua halaman customer, urut sesuai nomor urutan. Pilih ikon dari daftar,
          atau isi &ldquo;Logo kustom&rdquo; dengan URL gambar untuk platform yang tidak ada di daftar ikon.
        </p>

        <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-5 group" open={contacts.length === 0}>
          <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
            Tambah kontak
            <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">+</span>
          </summary>

          <CreateContactLinkForm />
        </details>

        {contacts.length === 0 ? (
          <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
            <p className="font-display font-semibold mb-1.5">Belum ada kontak</p>
            <p className="text-shihu-muted text-sm">Tambahkan lewat form di atas.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {contacts.map((c) => (
              <ContactLinkRowItem key={c.id} item={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
