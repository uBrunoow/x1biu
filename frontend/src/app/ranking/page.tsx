import { api } from "@/lib/api";
import Link from "next/link";

interface Player {
  nickname: string;
  wins: number;
  losses: number;
  winrate: number;
  streak: number;
}

async function getRanking(): Promise<Player[]> {
  try {
    const res = await api.get("ranking");
    return res.data as Player[];
  } catch {
    return [];
  }
}

const MEDAL: Record<number, string> = {
  1: "#ffd83a",
  2: "#cdd3db",
  3: "#e0915a",
};

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return <span style={{ color: "var(--faint)" }}>—</span>;
  const positive = streak > 0;
  return (
    <span style={{
      color: positive ? "var(--you)" : "#f87171",
      fontWeight: 700,
      fontSize: 12,
    }}>
      {positive ? `+${streak}` : streak}
    </span>
  );
}

export default async function RankingPage() {
  const players = await getRanking();

  return (
    <div className="screen-enter" style={{ flex: 1, overflow: "auto", padding: "28px 26px 40px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6 }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.04em" }}>
            ranking global
          </h1>
          <Link href="/" className="btn btn-primary">
            entrar na fila →
          </Link>
        </div>
        <p style={{ color: "var(--faint)", fontSize: 13, marginBottom: 24 }}>
          os melhores assobiadores do mundo. uma distinção que não cabe em currículo.
        </p>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "52px 1fr 80px 70px 70px 70px 80px",
            padding: "12px 18px",
            borderBottom: "1px solid var(--border)",
          }}>
            {["#", "jogador", "pontos", "V", "D", "seq.", "winrate"].map((h, i) => (
              <div key={h} className="mono-label" style={{ textAlign: i > 1 ? "right" : "left" }}>
                {h}
              </div>
            ))}
          </div>

          {players.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--faint)" }}>
              nenhum assobiador registrado ainda.
            </div>
          ) : (
            players.map((player, i) => {
              const pos = i + 1;
              const medal = MEDAL[pos] ?? null;
              const initial = player.nickname?.[0]?.toUpperCase() ?? "?";
              const pts = player.wins * 24 + player.losses * 6;
              return (
                <div
                  key={player.nickname}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "52px 1fr 80px 70px 70px 70px 80px",
                    padding: "13px 18px",
                    borderBottom: "1px solid var(--border)",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 800, color: medal ?? "var(--faint)", fontSize: medal ? 16 : 14 }}>
                    {pos}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 7,
                      background: "var(--surface-3)", color: "var(--muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: 13,
                    }}>
                      {initial}
                    </div>
                    <span style={{ fontWeight: 600 }}>{player.nickname}</span>
                  </div>
                  <div style={{ textAlign: "right", fontWeight: 700 }}>
                    {pts.toLocaleString("pt-BR")}
                  </div>
                  <div style={{ textAlign: "right", color: "var(--you)", fontWeight: 600 }}>
                    {player.wins}V
                  </div>
                  <div style={{ textAlign: "right", color: "var(--faint)" }}>
                    {player.losses}D
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <StreakBadge streak={player.streak} />
                  </div>
                  <div style={{ textAlign: "right", color: "var(--muted)", fontSize: 12 }}>
                    {(player.winrate * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p style={{ textAlign: "center", color: "var(--faint)", fontSize: 11.5, marginTop: 20 }}>
          subir uma posição não muda nada na sua vida. mas você quer mesmo assim.
        </p>
      </div>
    </div>
  );
}
