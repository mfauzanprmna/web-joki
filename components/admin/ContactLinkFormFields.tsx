import { CONTACT_ICON_OPTIONS } from "@/lib/contact-icons";

export interface ContactLinkFormDefaults {
  icon?: string;
  logoUrl?: string | null;
  name?: string;
  url?: string;
  position?: number;
}

/** Field kontak yang dipakai bareng oleh form tambah & form edit. Boleh
 * dirender dari server maupun client component (tanpa state sendiri). */
export function ContactLinkFormFields({
  defaults,
  showPosition = false,
}: {
  defaults?: ContactLinkFormDefaults;
  showPosition?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Nama <span className="text-red-400">*</span>
          </label>
          <input name="name" required maxLength={40} defaultValue={defaults?.name} className="admin-input" placeholder="mis. Discord" />
        </div>
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Ikon <span className="text-red-400">*</span>
          </label>
          <select name="icon" required defaultValue={defaults?.icon ?? "discord"} className="admin-input">
            {CONTACT_ICON_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Link <span className="text-red-400">*</span>
        </label>
        <input
          name="url"
          required
          maxLength={500}
          defaultValue={defaults?.url}
          className="admin-input"
          placeholder="https://discord.gg/xxxx"
        />
      </div>

      <div className={`grid grid-cols-1 ${showPosition ? "sm:grid-cols-[1fr_120px]" : ""} gap-3`}>
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Logo kustom (opsional)
          </label>
          <input
            name="logoUrl"
            defaultValue={defaults?.logoUrl ?? ""}
            className="admin-input"
            placeholder="https://.../logo.png — kosongkan untuk pakai ikon di atas"
          />
        </div>
        {showPosition && (
          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">Urutan</label>
            <input
              name="position"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={defaults?.position ?? 0}
              className="admin-input"
            />
          </div>
        )}
      </div>
    </div>
  );
}
