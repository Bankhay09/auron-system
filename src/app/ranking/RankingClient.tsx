"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SystemWindow } from "@/components/layout/SystemWindow";
import { RankBadge } from "@/components/RankBadge";
import type { Rank } from "@/types/auron";

type Progress = {
  rank: Rank;
  nextRank: Rank | null;
  nextRankXp: number | null;
  progress: number;
  remainingXp: number;
};

type Leader = {
  position: number;
  username: string;
  rank: Rank;
  xp: number;
  progress: Progress;
};

type Friend = {
  friendshipId: string;
  username: string;
  rank: Rank;
  xp: number;
  progress: Progress;
  status: "accepted" | "pending_sent" | "pending_received";
};

type SearchResult = {
  username: string;
  rank: Rank;
  xp: number;
  progress: Progress;
  friendshipStatus: "none" | "accepted" | "pending_sent" | "pending_received";
};

export function RankingClient() {
  const [globalLeaders, setGlobalLeaders] = useState<Leader[]>([]);
  const [friendLeaders, setFriendLeaders] = useState<Leader[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friend[]>([]);
  const [pendingSent, setPendingSent] = useState<Friend[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    const [globalData, friendData, friendshipData] = await Promise.all([
      getJson("/api/ranking?scope=global"),
      getJson("/api/ranking?scope=friends"),
      getJson("/api/friends")
    ]);
    setGlobalLeaders(globalData.leaders ?? []);
    setFriendLeaders(friendData.leaders ?? []);
    setFriends(friendshipData.friends ?? []);
    setPendingReceived(friendshipData.pendingReceived ?? []);
    setPendingSent(friendshipData.pendingSent ?? []);
    setLoading(false);
  }

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!query.trim()) return;
    const data = await getJson(`/api/friends?query=${encodeURIComponent(query)}`);
    if (!data.ok) {
      setMessage(data.message || "Nao foi possivel buscar usuarios.");
      return;
    }
    setResults(data.results ?? []);
  }

  async function addFriend(username: string) {
    const data = await postJson("/api/friends", { username });
    setMessage(data.message || (data.ok ? "Pedido enviado." : "Nao foi possivel enviar pedido."));
    if (data.ok) {
      setResults((current) => current.map((item) => item.username === username ? { ...item, friendshipStatus: "pending_sent" } : item));
      await refresh();
    }
  }

  async function friendshipAction(friendshipId: string, action: "accept" | "decline" | "cancel") {
    const data = await patchJson("/api/friends", { friendshipId, action });
    setMessage(data.message || "Operacao concluida.");
    await refresh();
  }

  const currentPlayer = useMemo(() => globalLeaders.find((item) => item.username && friendLeaders.some((friend) => friend.username === item.username)) ?? friendLeaders[0], [globalLeaders, friendLeaders]);

  return (
    <AppShell>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="auron-title text-4xl font-black uppercase md:text-6xl">Ranking</h1>
          <p className="mt-2 text-sm uppercase text-[#a9dfff]">Leaderboards // Global & Amigos</p>
        </div>
      </header>

      {message && <div className="mb-4 rounded-xl border border-[var(--auron-primary)]/50 bg-[var(--auron-primary)]/10 p-3 text-sm text-white">{message}</div>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-4">
          <SystemWindow title="Ranking Global">
            <Leaderboard leaders={globalLeaders} loading={loading} empty="Nenhum player no ranking global." />
          </SystemWindow>
          <SystemWindow title="Ranking de Amigos">
            <Leaderboard leaders={friendLeaders} loading={loading} empty="Adicione amigos para criar seu placar privado." />
          </SystemWindow>
        </div>

        <div className="grid content-start gap-4">
          <SystemWindow title="Meu Rank">
            {currentPlayer ? <RankCard leader={currentPlayer} /> : <div className="text-sm text-[#a9dfff]">Carregando status do jogador...</div>}
          </SystemWindow>

          <SystemWindow title="Buscar / Adicionar Amigos">
            <form onSubmit={search} className="flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="username"
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[var(--auron-primary)]"
              />
              <button className="rounded-xl border border-[var(--auron-primary)] px-4 text-sm font-black shadow-neon">Buscar</button>
            </form>
            <div className="mt-4 grid gap-2">
              {results.map((user) => (
                <div key={user.username} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-black">{user.username}</div>
                      <div className="text-xs text-[#a9dfff]">{user.xp} XP</div>
                    </div>
                    <RankBadge rank={user.rank} />
                  </div>
                  <button
                    onClick={() => addFriend(user.username)}
                    disabled={user.friendshipStatus !== "none"}
                    className="mt-3 w-full rounded-lg border border-[var(--auron-primary)]/70 px-3 py-2 text-xs font-black uppercase disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {statusLabel(user.friendshipStatus)}
                  </button>
                </div>
              ))}
              {!results.length && <div className="text-sm text-[#a9dfff]">Busque pelo username. Emails nunca aparecem aqui.</div>}
            </div>
          </SystemWindow>

          <SystemWindow title="Pedidos de Amizade">
            <FriendshipList title="Recebidos" items={pendingReceived} action={friendshipAction} received />
            <FriendshipList title="Enviados" items={pendingSent} action={friendshipAction} />
            <FriendshipList title="Amigos" items={friends} action={friendshipAction} />
          </SystemWindow>
        </div>
      </div>
    </AppShell>
  );
}

function Leaderboard({ leaders, loading, empty }: { leaders: Leader[]; loading: boolean; empty: string }) {
  if (loading) return <div className="text-sm text-[#a9dfff]">Sincronizando placar...</div>;
  if (!leaders.length) return <div className="text-sm text-[#a9dfff]">{empty}</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-separate border-spacing-y-2 text-sm">
        <thead className="text-left text-xs uppercase tracking-[0.16em] text-[#a9dfff]">
          <tr>
            <th className="px-3">#</th>
            <th className="px-3">Username</th>
            <th className="px-3">Rank</th>
            <th className="px-3">XP</th>
            <th className="px-3">Proximo rank</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((leader) => (
            <tr key={`${leader.position}-${leader.username}`} className="bg-white/[0.04]">
              <td className="rounded-l-xl border-y border-l border-white/10 px-3 py-3 font-black">{leader.position}</td>
              <td className="border-y border-white/10 px-3 py-3 font-black">{leader.username}</td>
              <td className="border-y border-white/10 px-3 py-3"><RankBadge rank={leader.rank} /></td>
              <td className="border-y border-white/10 px-3 py-3">{leader.xp.toLocaleString("pt-BR")}</td>
              <td className="rounded-r-xl border-y border-r border-white/10 px-3 py-3">
                <RankProgress progress={leader.progress} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankCard({ leader }: { leader: Leader }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <RankBadge rank={leader.rank} />
        <div>
          <div className="text-2xl font-black">{leader.username}</div>
          <div className="text-sm text-[#a9dfff]">{leader.xp.toLocaleString("pt-BR")} XP acumulado</div>
        </div>
      </div>
      <div className="mt-4">
        <RankProgress progress={leader.progress} />
      </div>
    </div>
  );
}

function RankProgress({ progress }: { progress: Progress }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-xs text-[#a9dfff]">
        <span>{progress.nextRank ? `Rumo ao Rank ${progress.nextRank}` : "Rank maximo"}</span>
        <strong className="text-white">{progress.progress}%</strong>
      </div>
      <div className="auron-bar"><span style={{ width: `${progress.progress}%` }} /></div>
      <div className="mt-1 text-[11px] text-[#a9dfff]">
        {progress.nextRank ? `${progress.remainingXp.toLocaleString("pt-BR")} XP restantes` : "SSS alcancado"}
      </div>
    </div>
  );
}

function FriendshipList({ title, items, action, received = false }: { title: string; items: Friend[]; action: (id: string, action: "accept" | "decline" | "cancel") => void; received?: boolean }) {
  return (
    <div className="mt-3">
      <div className="mb-2 text-xs font-black uppercase text-[#a9dfff]">{title}</div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.friendshipId} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-black">{item.username}</div>
                <div className="text-xs text-[#a9dfff]">{item.xp} XP</div>
              </div>
              <RankBadge rank={item.rank} />
            </div>
            {item.status !== "accepted" && (
              <div className="mt-3 flex gap-2">
                {received && <button onClick={() => action(item.friendshipId, "accept")} className="rounded-lg border border-[var(--auron-success)]/70 px-3 py-1 text-xs font-black">Aceitar</button>}
                <button onClick={() => action(item.friendshipId, received ? "decline" : "cancel")} className="rounded-lg border border-[var(--auron-danger)]/70 px-3 py-1 text-xs font-black">{received ? "Recusar" : "Cancelar"}</button>
              </div>
            )}
          </div>
        ))}
        {!items.length && <div className="text-xs text-[#a9dfff]">Nada por aqui.</div>}
      </div>
    </div>
  );
}

function statusLabel(status: SearchResult["friendshipStatus"]) {
  if (status === "accepted") return "Ja e amigo";
  if (status === "pending_sent") return "Pedido enviado";
  if (status === "pending_received") return "Pedido recebido";
  return "Adicionar amigo";
}

async function getJson(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  return response.json().catch(() => ({ ok: false, message: "Resposta invalida." }));
}

async function postJson(url: string, body: Record<string, string>) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return response.json().catch(() => ({ ok: false, message: "Resposta invalida." }));
}

async function patchJson(url: string, body: Record<string, string>) {
  const response = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return response.json().catch(() => ({ ok: false, message: "Resposta invalida." }));
}
