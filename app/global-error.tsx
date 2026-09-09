"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Terjadi error fatal di aplikasi:", error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          backgroundColor: "#15111F",
          color: "#FBF9FF",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "9999px",
              backgroundColor: "#E2504A18",
              color: "#E2504A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Aplikasi mengalami masalah
          </h1>
          <p style={{ color: "#B7ADD1", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
            {error.digest ? ` (Kode: ${error.digest})` : ""}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              color: "#1A1206",
              background: "linear-gradient(135deg, #FFB238, #FF7A45)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Muat ulang
          </button>
        </div>
      </body>
    </html>
  );
}
