"use client";

import { PlayerChip } from "@/components/player-chip";
import { SoundMark } from "@/components/sound-mark";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { createWebSocket } from "@/lib/ws";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function QueuePage() {
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const { nickname } = useAuth();
  const [secs, setSecs] = useState(0);
  const [rivalName, setRivalName] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    let isActive = true;
    const ws = createWebSocket("/ws/queue/", token);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isActive) {
        ws.close();
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "match_found") {
        setRivalName(data.rival_nickname ?? "oponente");
        setTimeout(() => {
          ws.close();
          router.push(`/match/${data.match_id}`);
        }, 1500);
      }
    };

    ws.onerror = () => {
      if (!isActive) return;
      toast.error("Conexão perdida. Tente novamente.");
      router.push("/");
    };

    ws.onclose = () => {
      if (!isActive) return;
    };

    const tick = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => {
      isActive = false;
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
      clearInterval(tick);
    };
  }, [router]);

  async function handleLeave() {
    const ws = wsRef.current;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
    try {
      await api.delete("/queue/leave/");
    } catch {}
    router.push("/");
  }

  const found = rivalName !== null;

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
        style={{
          position: "relative",
          width: 150,
          height: 150,
          marginBottom: 8,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `1px solid ${found ? "var(--you-dim)" : "var(--border-2)"}`,
              animation: `radar 2.4s ${i * 0.8}s ease-out infinite`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SoundMark
            size={56}
            live
            color={found ? "var(--you)" : "var(--muted)"}
          />
        </div>
      </div>

      <h2
        style={{
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginTop: 22,
        }}
      >
        {found
          ? "oponente encontrado"
          : "procurando alguém igualmente sem o que fazer…"}
      </h2>

      {found ? (
        <div
          className="fade-up"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            margin: "22px 0",
          }}
        >
          <PlayerChip name={nickname ?? "você"} color="var(--you)" you />
          <span
            style={{ fontWeight: 800, color: "var(--faint)", fontSize: 18 }}
          >
            VS
          </span>
          <PlayerChip name={rivalName!} color="var(--rival)" />
        </div>
      ) : (
        <p style={{ color: "var(--muted)", marginTop: 10 }}>
          {secs}s esperando
        </p>
      )}

      {!found && (
        <button
          className="btn btn-ghost"
          style={{ marginTop: 26 }}
          onClick={handleLeave}
        >
          desistir (ninguém vai julgar)
        </button>
      )}
    </div>
  );
}
