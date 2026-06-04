"use client";

import { SoundMark } from "@/components/sound-mark";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const FACTS = [
  "0 problemas reais resolvidos",
  "100% do tempo: você assobiando pro PC",
  "ranking global de uma habilidade que ninguém pediu",
  "sim, precisa de microfone",
];

export default function HomePage() {
  const router = useRouter();
  const { user, nickname, loading, signOut } = useAuth();
  const [inQueue, setInQueue] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .get("/queue/join/")
      .then(({ data }) => setInQueue(data.in_queue))
      .catch(() => {});
  }, [user]);

  async function handlePlay() {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      await api.post("/queue/join/");
      router.push("/queue");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        .response?.data?.detail;
      if (detail === "Você já está na fila") {
        router.push("/queue");
        return;
      }
      toast.error(detail ?? "Erro ao entrar na fila");
    }
  }

  async function handleLeaveQueue() {
    await api.delete("/queue/leave/").catch(() => {});
    setInQueue(false);
  }

  if (loading) return null;

  return (
    <div className="screen-enter" style={{ flex: 1, overflow: "auto" }}>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div className="badge" style={{ marginBottom: 26 }}>
        <span className="dot" style={{ background: "var(--you)" }} />
        projeto orgulhosamente inútil · v0.1
      </div>

      <SoundMark size={68} live />

      <h1
        style={{
          fontSize: "clamp(44px, 9vw, 92px)",
          fontWeight: 800,
          letterSpacing: "-0.06em",
          margin: "20px 0 6px",
          lineHeight: 0.95,
        }}
      >
        x1<span style={{ color: "var(--you)" }}>biu</span>
      </h1>

      <p
        style={{
          fontSize: 17,
          color: "var(--muted)",
          maxWidth: 480,
          marginBottom: 4,
        }}
      >
        batalha 1v1 de{" "}
        <strong style={{ color: "var(--text)" }}>assobios</strong>. uma música
        toca, os dois assobiam, o microfone julga. quem chega mais perto da
        melodia vence.
      </p>
      <p style={{ fontSize: 13.5, color: "var(--faint)", marginBottom: 30 }}>
        não tem prêmio. não tem propósito. tem ranking.
      </p>

      <div
        className="card"
        style={{ padding: 18, width: "min(440px, 92vw)", textAlign: "left" }}
      >
        {user ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div className="mono-label" style={{ marginBottom: 4 }}>
                logado como
              </div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{nickname}</div>
            </div>
            {inQueue ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  aguardando na fila…
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 12 }}
                    onClick={handleLeaveQueue}
                  >
                    sair da fila
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => router.push("/queue")}
                  >
                    voltar →
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={handlePlay}>
                entrar na fila →
              </button>
            )}
          </div>
        ) : (
          <>
            <label
              className="mono-label"
              style={{ display: "block", marginBottom: 8 }}
            >
              acesso
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
                onClick={handlePlay}
              >
                entrar / criar conta →
              </button>
            </div>
          </>
        )}
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}
        >
          {FACTS.map((f) => (
            <span
              key={f}
              className="badge"
              style={{ fontSize: 10, letterSpacing: "0.04em" }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {user && (
        <button
          className="btn btn-ghost"
          style={{ marginTop: 18, fontSize: 12 }}
          onClick={signOut}
        >
          sair da conta
        </button>
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: "var(--faint)" }}>
        dica: chegue perto da linha cinza. é literalmente isso.
      </div>
    </div>
    </div>
  );
}
