"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AlertVariant = "success" | "error" | "warning" | "info" | "question";

export interface AlertButton {
  label: string;
  variant?: "primary" | "ghost" | "danger";
  onClick?: () => void;
}

export interface AlertOptions {
  variant?: AlertVariant;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Tutup otomatis setelah N ms (mis. untuk notifikasi sukses singkat). */
  autoCloseMs?: number;
}

interface AlertState extends AlertOptions {
  id: number;
  resolve?: (confirmed: boolean) => void;
}

interface SweetAlertContextValue {
  /** Tampilkan alert dan resolve `true`/`false` sesuai tombol yang ditekan. */
  fire: (options: AlertOptions) => Promise<boolean>;
  /** Shortcut untuk notifikasi sukses, otomatis tertutup. */
  success: (title: string, description?: string) => void;
  /** Shortcut untuk notifikasi error. */
  error: (title: string, description?: string) => void;
  /** Shortcut untuk notifikasi peringatan. */
  warning: (title: string, description?: string) => void;
  /** Shortcut untuk konfirmasi ya/tidak, resolve `true` jika user menekan konfirmasi. */
  confirm: (title: string, description?: string) => Promise<boolean>;
}

const SweetAlertContext = createContext<SweetAlertContextValue | null>(null);

const VARIANT_ICON: Record<AlertVariant, ReactNode> = {
  success: <IconCheck />,
  error: <IconCross />,
  warning: <IconWarning />,
  info: <IconInfo />,
  question: <IconQuestion />,
};

const VARIANT_STYLE: Record<AlertVariant, { ring: string; glow: string }> = {
  success: { ring: "#4CD97D", glow: "#4CD97D26" },
  error: { ring: "#E2504A", glow: "#E2504A26" },
  warning: { ring: "#FFB238", glow: "#FFB23826" },
  info: { ring: "#4FE0FF", glow: "#4FE0FF26" },
  question: { ring: "#A385FF", glow: "#A385FF26" },
};

export function SweetAlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState | null>(null);
  const idRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback((confirmed: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setAlert((current) => {
      current?.resolve?.(confirmed);
      return null;
    });
  }, []);

  const fire = useCallback((options: AlertOptions) => {
    return new Promise<boolean>((resolve) => {
      idRef.current += 1;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setAlert({ ...options, id: idRef.current, resolve });

      if (options.autoCloseMs) {
        timeoutRef.current = setTimeout(() => {
          setAlert((current) => {
            if (current && current.id === idRef.current) {
              current.resolve?.(true);
              return null;
            }
            return current;
          });
        }, options.autoCloseMs);
      }
    });
  }, []);

  const success = useCallback(
    (title: string, description?: string) => {
      void fire({ variant: "success", title, description, autoCloseMs: 2600 });
    },
    [fire]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      void fire({ variant: "error", title, description, confirmLabel: "Oke, mengerti" });
    },
    [fire]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      void fire({ variant: "warning", title, description, confirmLabel: "Oke" });
    },
    [fire]
  );

  const confirm = useCallback(
    (title: string, description?: string) => {
      return fire({
        variant: "question",
        title,
        description,
        confirmLabel: "Ya, lanjutkan",
        cancelLabel: "Batal",
      });
    },
    [fire]
  );

  return (
    <SweetAlertContext.Provider value={{ fire, success, error, warning, confirm }}>
      {children}
      {alert && <AlertModal alert={alert} onClose={close} />}
    </SweetAlertContext.Provider>
  );
}

function AlertModal({
  alert,
  onClose,
}: {
  alert: AlertState;
  onClose: (confirmed: boolean) => void;
}) {
  const variant = alert.variant ?? "info";
  const style = VARIANT_STYLE[variant];
  const showCancel = !!alert.cancelLabel;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sweet-alert-title"
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
    >
      <div
        className="absolute inset-0 bg-[#0B0912]/70 backdrop-blur-sm animate-shihu-fade-in"
        onClick={() => (showCancel ? onClose(false) : undefined)}
      />

      <div
        className="relative w-full max-w-sm bg-shihu-card border border-shihu-border rounded-2xl px-6 pt-8 pb-6 text-center animate-shihu-pop-in shadow-2xl"
        style={{ boxShadow: `0 0 0 1px ${style.ring}22, 0 24px 60px -16px ${style.glow}` }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: style.glow, color: style.ring }}
        >
          {VARIANT_ICON[variant]}
        </div>

        <h2
          id="sweet-alert-title"
          className="font-display text-lg font-bold text-shihu-text mb-1.5"
        >
          {alert.title}
        </h2>

        {alert.description && (
          <p className="text-shihu-muted text-sm leading-relaxed mb-6">
            {alert.description}
          </p>
        )}
        {!alert.description && <div className="mb-6" />}

        <div className="flex gap-2.5 justify-center">
          {showCancel && (
            <button
              type="button"
              onClick={() => onClose(false)}
              className="flex-1 px-4 py-2.5 rounded-xl font-display font-semibold text-sm text-shihu-muted bg-[#2C2540] hover:bg-[#332B4A] transition-colors"
            >
              {alert.cancelLabel}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => onClose(true)}
            className="flex-1 px-4 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona hover:opacity-90 transition-opacity"
          >
            {alert.confirmLabel ?? "Oke"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useSweetAlert() {
  const ctx = useContext(SweetAlertContext);
  if (!ctx) {
    throw new Error("useSweetAlert harus dipakai di dalam <SweetAlertProvider>");
  }
  return ctx;
}

function IconCheck() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCross() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 9v4.5M12 17h.01M10.6 3.9l-8.4 14.5a1.6 1.6 0 001.4 2.4h16.8a1.6 1.6 0 001.4-2.4L13.4 3.9a1.6 1.6 0 00-2.8 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 11v6M12 7.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconQuestion() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M9.5 9a2.5 2.5 0 114 2c-.7.6-1.5 1.1-1.5 2.2M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
