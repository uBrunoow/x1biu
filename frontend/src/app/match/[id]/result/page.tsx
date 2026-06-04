"use client";

import { AccuracyRing } from "@/components/accuracy-ring";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Participant {
  id: number;
  nickname: string;
  score: number;
  result: "win" | "loss" | "draw" | "pending";
}

interface Match {
  id: number;
  song_title: string;
  status: string;
  winner: number | null;
  participants: Participant[];
}

export default function MatchResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { nickname } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Match>(`/matches/${params.id}/`)
      .then((res) => setMatch(res.data))
      .catch(() => setMatch(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 48 }}>🏆</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "var(--muted)" }}>Partida não encontrada</p>
      </div>
    );
  }

  const me =
    match.participants.find((p) => p.nickname === nickname) ??
    match.participants[0];
  const rival =
    match.participants.find((p) => p.nickname !== nickname) ??
    match.participants[1];
  const win = me?.result === "win";
  const isDraw = match.participants.every((p) => p.result === "draw");
  const c = isDraw ? "var(--muted)" : win ? "var(--you)" : "var(--rival)";
  const headline = isDraw ? "EMPATE" : win ? "VITÓRIA" : "DERROTA";
  const subline = isDraw
    ? "exatamente iguais em inutilidade."
    : win
      ? "seus vizinhos te ouviram. valeu a pena."
      : "seu assobio precisa de… tudo. mas continue.";

  const maxScore = Math.max(...match.participants.map((p) => p.score), 1);
  const acc = me ? Math.round(Math.min(100, (me.score / maxScore) * 100)) : 0;

  return (
    <div
      className="screen-enter"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        className="badge"
        style={{ color: c, borderColor: c, marginBottom: 18 }}
      >
        <span className="dot" />
        fim da música
      </div>

      <h1
        style={{
          fontSize: "clamp(48px,10vw,96px)",
          fontWeight: 800,
          letterSpacing: "-0.06em",
          color: c,
          lineHeight: 0.9,
        }}
      >
        {headline}
      </h1>
      <p
        style={{
          color: "var(--muted)",
          marginTop: 8,
          marginBottom: 30,
          maxWidth: 420,
        }}
      >
        {subline}
      </p>

      <div className="card" style={{ padding: 24, width: "min(480px,94vw)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
          }}
        >
          <ScoreCol
            name={me?.nickname ?? "você"}
            score={me?.score ?? 0}
            color="var(--you)"
            winner={win}
          />
          <div>
            <AccuracyRing pct={acc} color={c} />
            <div className="mono-label" style={{ marginTop: 8 }}>
              {acc}% precisão
            </div>
          </div>
          <ScoreCol
            name={rival?.nickname ?? "rival"}
            score={rival?.score ?? 0}
            color="var(--rival)"
            winner={!win && !isDraw}
          />
        </div>
        <div
          style={{
            borderTop: "1px solid var(--border)",
            marginTop: 20,
            paddingTop: 16,
            display: "flex",
            gap: 18,
            justifyContent: "center",
            fontSize: 12,
            color: "var(--faint)",
          }}
        >
          <span>+{win ? 24 : 6} pts no ranking</span>
          <span>·</span>
          <span>{win ? "subiu 3 posições" : "caiu 1 posição"}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => router.push("/queue")}
        >
          jogar de novo →
        </button>
        <button
          className="btn btn-ghost btn-lg"
          onClick={() => router.push("/ranking")}
        >
          ver ranking
        </button>
        <button
          className="btn btn-ghost btn-lg"
          onClick={() => router.push(`/history/${params.id}`)}
        >
          ver detalhes
        </button>
      </div>
    </div>
  );
}

function ScoreCol({
  name,
  score,
  color,
  winner,
}: { name: string; score: number; color: string; winner: boolean }) {
  return (
    <div style={{ textAlign: "center", opacity: winner ? 1 : 0.65 }}>
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color,
          letterSpacing: "-0.04em",
        }}
      >
        {score.toLocaleString("pt-BR")}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>{name}</div>
      {winner && (
        <div
          className="badge"
          style={{ color, borderColor: color, marginTop: 8 }}
        >
          👑 venceu
        </div>
      )}
    </div>
  );
}
