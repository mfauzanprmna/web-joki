"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/format";
import { OrderLineSelector, type JokiItemOption, type JokiPaketOption, type PatchEventOption, type EndgameContentOption, type ExportedLine } from "./OrderLineSelector";
import type { AccountOption } from "./CustomerSelector";

interface GameOption {
  id: string;
  name: string;
}

export interface AccountData {
  accountId: string;
  accountName: string;
  accountUid: string;
  gameId: string;
  jokerName: string;
  estimasiJoki: string;
  lines: ExportedLine[];
  total: number;
}

interface OrderAccountTabProps {
  games: GameOption[];
  items: JokiItemOption[];
  pakets: JokiPaketOption[];
  events: PatchEventOption[];
  endgameContents: EndgameContentOption[];
  accounts: AccountOption[];
  onChange: (data: AccountData) => void;
}

export function OrderAccountTab({ games, items, pakets, events, endgameContents, accounts, onChange }: OrderAccountTabProps) {
  const [accountId, setAccountId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountUid, setAccountUid] = useState("");
  const [gameId, setGameId] = useState(games[0]?.id ?? "");
  const [jokerName, setJokerName] = useState("");
  const [estimasiJoki, setEstimasiJoki] = useState("");
  const [lines, setLines] = useState<ExportedLine[]>([]);
  const [total, setTotal] = useState(0);
  const [selectorKey, setSelectorKey] = useState(0);

  function emit(next: Partial<{ accountId: string; accountName: string; accountUid: string; gameId: string; jokerName: string; estimasiJoki: string; lines: ExportedLine[]; total: number }>) {
    const merged = {
      accountId: next.accountId ?? accountId,
      accountName: next.accountName ?? accountName,
      accountUid: next.accountUid ?? accountUid,
      gameId: next.gameId ?? gameId,
      jokerName: next.jokerName ?? jokerName,
      estimasiJoki: next.estimasiJoki ?? estimasiJoki,
      lines: next.lines ?? lines,
      total: next.total ?? total,
    };
    onChange(merged);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Akun game
        </label>
        <select
          className="admin-input"
          value={accountId || "new"}
          onChange={(e) => {
            const nextAccountId = e.target.value === "new" ? "" : e.target.value;
            const account = accounts.find((candidate) => candidate.id === nextAccountId);
            setAccountId(nextAccountId);
            setAccountName(account?.name ?? "");
            setAccountUid(account?.uid ?? "");
            if (account && account.gameId !== gameId) {
              setGameId(account.gameId);
              setLines([]);
              setTotal(0);
              setSelectorKey((k) => k + 1);
              emit({ accountId: nextAccountId, accountName: account.name, accountUid: account.uid ?? "", gameId: account.gameId, lines: [], total: 0 });
            } else {
              emit({ accountId: nextAccountId, accountName: account?.name ?? "", accountUid: account?.uid ?? "" });
            }
          }}
        >
          <option value="new">+ Buat akun baru</option>
          {(accounts ?? []).filter((account) => account.gameId === gameId).map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}{account.uid ? ` · ${account.uid}` : ""}
            </option>
          ))}
        </select>
        {!accountId && (
          <input
            value={accountName}
            onChange={(e) => {
              setAccountName(e.target.value);
              emit({ accountName: e.target.value });
            }}
            className="admin-input mt-2"
            placeholder="Nama akun"
            required
          />
        )}
        {!accountId && (
          <input
            value={accountUid}
            onChange={(e) => {
              setAccountUid(e.target.value);
              emit({ accountUid: e.target.value });
            }}
            className="admin-input mt-2"
            placeholder="UID akun (opsional)"
          />
        )}
        {accountId && <p className="text-[11px] text-shihu-faint mt-1">Pesanan ini akan masuk ke akun yang sudah dipilih.</p>}
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Game
        </label>
        <select
          className="admin-input"
          value={gameId}
          onChange={(e) => {
            const newGameId = e.target.value;
            setGameId(newGameId);
            setAccountId("");
            setAccountName("");
            setAccountUid("");
            setLines([]);
            setTotal(0);
            setSelectorKey((k) => k + 1);
            emit({ accountId: "", accountName: "", accountUid: "", gameId: newGameId, lines: [], total: 0 });
          }}
        >
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Nama joki (opsional)
        </label>
        <input
          value={jokerName}
          onChange={(e) => {
            setJokerName(e.target.value);
            emit({ jokerName: e.target.value });
          }}
          className="admin-input"
          placeholder="Nayla"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Estimasi pengerjaan
        </label>
        <input
          value={estimasiJoki}
          onChange={(e) => {
            setEstimasiJoki(e.target.value);
            emit({ estimasiJoki: e.target.value });
          }}
          className="admin-input"
          placeholder="mis. 2-3 hari"
        />
      </div>

      <OrderLineSelector
        key={selectorKey}
        gameId={gameId}
        items={items}
        pakets={pakets}
        events={events}
        endgameContents={endgameContents}
        onLinesChange={(newLines, newTotal) => {
          setLines(newLines);
          setTotal(newTotal);
          emit({ lines: newLines, total: newTotal });
        }}
      />

      <div className="flex items-center justify-between bg-[#241E38] border border-shihu-border rounded-xl px-4 py-3">
        <span className="text-xs font-display font-medium text-shihu-muted">Subtotal akun ini</span>
        <span className="font-display font-bold text-shihu-corona">{formatRupiah(total)}</span>
      </div>
    </div>
  );
}
