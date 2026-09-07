"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { ShihuMark } from "@/components/ShihuMark";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-shihu-bg relative px-6">
      <div className="shihu-glow-top" />
      <div className="shihu-glow-bottom" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <ShihuMark size={48} />
          <h1 className="font-display text-xl font-bold mt-3">Shihu Service</h1>
          <p className="text-shihu-muted text-sm mt-1">Panel admin</p>
        </div>

        <form
          action={formAction}
          className="bg-shihu-card border border-shihu-border rounded-2xl p-6 flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="password"
              className="block text-[13px] font-display font-medium text-shihu-muted mb-1.5"
            >
              Password admin
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full bg-[#241E38] border border-shihu-border rounded-xl px-3.5 py-2.5 text-sm text-shihu-text outline-none focus:border-shihu-corona transition-colors"
              placeholder="Masukkan password"
            />
          </div>

          {state?.error && (
            <p className="text-[13px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona disabled:opacity-60"
          >
            {pending ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
