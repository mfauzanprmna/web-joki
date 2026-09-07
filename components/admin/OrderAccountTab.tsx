"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/format";
import { OrderLineSelector, type JokiItemOption, type JokiPaketOption, type ExportedLine } from "./OrderLineSelector";

interface GameOption {
  id: string;
  name: string;
}

export interface AccountData {
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
  onChange: (data: AccountData) => void;
}

export function OrderAccountTab({ games, items, pakets, onChange }: OrderAccountTabProps) {
  const [gameId, setGameId] = useState(games[0]?.id ?? "");
  const [jokerName, setJokerName] = useState("");
  const [estimasiJoki, setEstimasiJoki] = useState("");
  const [lines, setLines] = useState<ExportedLine[]>([]);
  const [total, setTotal] = useState(0);
  const [selectorKey, setSelectorKey] = useState(0);

  function emit(next: Partial<{ gameId: string; jokerName: string; estimasiJoki: string; lines: ExportedLine[]; total: number }>) {
    const merged = {
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
          Game
        </label>
        <select
          className="admin-input"
          value={gameId}
          onChange={(e) => {
            const newGameId = e.target.value;
            setGameId(newGameId);
            setLines([]);
            setTotal(0);
            setSelectorKey((k) => k + 1);
            emit({ gameId: newGameId, lines: [], total: 0 });
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
