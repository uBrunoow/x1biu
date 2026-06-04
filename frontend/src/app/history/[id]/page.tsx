"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PitchChart } from "@/components/pitch-chart";

interface PitchPoint { frame: number; hz: number; }

interface Participant {
  player_id: number;
  nickname: string;
  score: number;
  result: string;
  pitch_data: PitchPoint[];
}

interface MatchDetail {
  id: number;
  song_title: string;
  song_artist: string;
  duration_ms: number;
  status: string;
  winner: number | null;
  started_at: string | null;
  finished_at: string | null;
  participants: Participant[];
  pitch_reference: PitchPoint[];
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function MatchHistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user && !loading) { router.push("/login"); return; }
    if (!user) return;
    api.get(`/matches/${params.id}/`)
      .then(({ data }) => setMatch(data))
      .catch(() => router.push("/history"))
      .finally(() => setFetching(false));
  }, [user, loading, params.id, router]);

  if (loading || fetching || !match) return null;

  const myId = (user as { user_id?: number })?.user_id;
  const me = match.participants.find((p) => p.player_id === myId);
  const opponent = match.participants.find((p) => p.player_id !== myId);

  const resultLabel: Record<string, string> = {
    win: "vitória", loss: "derrota", draw: "empate",
  };

  return (
    <div className="screen-enter" style={{ flex: 1, overflow: "auto", padding: "28px 26px 40px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <Link href="/history" className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>
                ← histórico
              </Link>
              {me?.result && (
                <span style={{
                  fontWeight: 800, fontSize: 13,
                  color: me.result === "win" ? "var(--you)" : me.result === "loss" ? "#f87171" : "var(--muted)",
                }}>
                  {resultLabel[me.result] ?? me.result}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
              {match.song_artist} — {match.song_title}
            </h1>
            <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4, display: "flex", gap: 16 }}>
              <span>{formatDuration(match.duration_ms)}</span>
              <span>{formatDate(match.finished_at)}</span>
            </div>
          </div>
        </div>

        {/* Score card */}
        <div className="card" style={{ padding: "18px 24px", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>{me?.nickname ?? "você"}</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: "var(--you)", letterSpacing: "-0.04em" }}>
                {me?.score ?? 0}
              </div>
              <div style={{ fontSize: 11, color: "var(--faint)" }}>pontos</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "var(--faint)" }}>VS</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>{opponent?.nickname ?? "rival"}</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: "var(--rival)", letterSpacing: "-0.04em" }}>
                {opponent?.score ?? 0}
              </div>
              <div style={{ fontSize: 11, color: "var(--faint)" }}>pontos</div>
            </div>
          </div>
        </div>

        {/* Pitch chart */}
        <div className="card" style={{ padding: "18px 24px" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>análise de pitch</div>
            <div style={{ fontSize: 12, color: "var(--faint)" }}>
              Hz detectado × referência da música — valores dobrados para a faixa de assobio (500–4000 Hz)
            </div>
          </div>

          {(me?.pitch_data?.length ?? 0) === 0 && (opponent?.pitch_data?.length ?? 0) === 0 && (match.pitch_reference?.length ?? 0) === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--faint)", fontSize: 13 }}>
              dados de pitch não disponíveis para esta partida.
            </div>
          ) : (
            <PitchChart
              pitchRef={match.pitch_reference}
              myData={me?.pitch_data ?? []}
              opponentData={opponent?.pitch_data ?? []}
              myLabel={me?.nickname ?? "você"}
              opponentLabel={opponent?.nickname ?? "rival"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
