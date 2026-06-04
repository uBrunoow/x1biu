"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Participant {
  player_id: number;
  nickname: string;
  score: number;
  result: "win" | "loss" | "draw" | "pending";
}

interface Match {
  id: number;
  song_title: string;
  song_artist: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  participants: Participant[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ResultBadge({ result, matchStatus }: { result: string; matchStatus: string }) {
  if (matchStatus === "cancelled") {
    return <span style={{ color: "var(--faint)", fontWeight: 700, fontSize: 12 }}>cancelado</span>;
  }
  const map: Record<string, { label: string; color: string }> = {
    win:  { label: "vitória", color: "var(--you)" },
    loss: { label: "derrota", color: "#f87171" },
    draw: { label: "empate",  color: "var(--muted)" },
  };
  const entry = map[result];
  if (!entry) return null;
  return <span style={{ color: entry.color, fontWeight: 700, fontSize: 12 }}>{entry.label}</span>;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!user && !loading) { router.push("/login"); return; }
    if (!user) return;
    setFetching(true);
    api.get(`/matches/?page=${page}`).then(({ data }) => {
      if (Array.isArray(data)) {
        setMatches(data);
        setTotalPages(1);
      } else {
        setMatches(data.results ?? []);
        const count = data.count ?? 0;
        setTotalPages(Math.max(1, Math.ceil(count / 10)));
      }
    }).finally(() => setFetching(false));
  }, [user, loading, router, page]);

  if (loading || fetching) return null;

  return (
    <div className="screen-enter" style={{ flex: 1, overflow: "auto", padding: "28px 26px 40px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6 }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.04em" }}>histórico</h1>
          <Link href="/" className="btn btn-primary">entrar na fila →</Link>
        </div>
        <p style={{ color: "var(--faint)", fontSize: 13, marginBottom: 24 }}>
          suas partidas passadas. derrota registrada é derrota eternal.
        </p>

        <div className="card" style={{ overflow: "hidden" }}>
          {matches.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--faint)" }}>
              nenhuma partida ainda.
            </div>
          ) : (
            matches.map((match) => {
              const myId = (user as { user_id?: number })?.user_id;
              const me = match.participants.find((p) => p.player_id === myId);
              const opponent = match.participants.find((p) => p.player_id !== myId);
              const myResult = me?.result ?? "";
              const canViewDetail = match.status === "finished";

              return (
                <div
                  key={match.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    padding: "14px 18px",
                    borderBottom: "1px solid var(--border)",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <ResultBadge result={myResult} matchStatus={match.status} />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {match.song_artist} — {match.song_title}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--faint)", display: "flex", gap: 16 }}>
                      <span>vs {opponent?.nickname ?? "—"}</span>
                      <span>{me?.score ?? 0} pts × {opponent?.score ?? 0} pts</span>
                      <span>{formatDate(match.finished_at ?? match.started_at)}</span>
                    </div>
                  </div>
                  {canViewDetail ? (
                    <Link
                      href={`/history/${match.id}`}
                      className="btn btn-ghost"
                      style={{ fontSize: 12, whiteSpace: "nowrap" }}
                    >
                      ver detalhes →
                    </Link>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--faint)" }}>{match.status}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20 }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12 }}
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← anterior
            </button>
            <span style={{ fontSize: 12, color: "var(--faint)" }}>
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12 }}
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
