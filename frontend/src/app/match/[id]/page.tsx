"use client";

import { PitchMeter } from "@/components/pitch-meter";
import { SoundMark } from "@/components/sound-mark";
import { useAuth } from "@/hooks/useAuth";
import { useMatchWebSocket } from "@/hooks/useMatchWebSocket";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SONG_LEN_FALLBACK = 30;
const HZ_MIN = 500;
const HZ_MAX = 4000;

function hzToNorm(hz: number): number {
  return Math.max(0, Math.min(1, (hz - HZ_MIN) / (HZ_MAX - HZ_MIN)));
}

function refHzToNorm(hz: number): number {
  if (!hz) return 0.5;
  let h = hz;
  while (h < HZ_MIN) h *= 2;
  while (h >= HZ_MAX) h /= 2;
  return hzToNorm(h);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const matchId = params.id;
  const { nickname } = useAuth();

  const {
    status,
    songUrl,
    songTitle,
    songArtist,
    durationMs,
    pitchRef,
    rivalName,
    myScore,
    opponentScore,
    rivalHz,
    sendPitchFrame,
    sendSongEnded,
  } = useMatchWebSocket(matchId);

  const { hz, isListening, start: startMic, stop: stopMic } = usePitchDetection();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const frameRef = useRef(0);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const [progress, setProgress] = useState(0);
  const [target, setTarget] = useState(0.5);
  const [combo, setCombo] = useState(0);
  const [phase, setPhase] = useState<"waiting" | "tap" | "count" | "play">("waiting");
  const [count, setCount] = useState(3);
  const rafRef = useRef<number>(0);

  const durationS = (durationMs ?? SONG_LEN_FALLBACK * 1000) / 1000;
  const youNorm = hz && hz > 0 ? hzToNorm(hz) : 0.5;
  const onBeat = Math.abs(target - youNorm) < 0.08;

  useEffect(() => {
    if (status === "playing" && phase === "waiting") {
      setPhase("tap");
    }
  }, [status, phase]);

  // iOS Safari blocks audio.play() unless called synchronously inside a user gesture.
  // We "unlock" the audio element here (play+pause in the tap handler), so the later
  // programmatic play() at countdown end is allowed by WebKit.
  const handleTapToStart = useCallback(() => {
    if (!songUrl) return;

    const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(songUrl)}`;
    const audio = new Audio(proxyUrl);
    audio.muted = true;
    audio.play().then(() => {
      audio.pause();
      audio.muted = false;
      audio.currentTime = 0;
    }).catch(() => {});

    audioRef.current = audio;
    startMic();
    setPhase("count");
  }, [songUrl, startMic]);

  useEffect(() => {
    if (phase !== "count") return;

    if (count <= 0) {
      setPhase("play");
      startTimeRef.current = performance.now();

      const audio = audioRef.current;
      if (audio) {
        audio.addEventListener("ended", sendSongEnded, { once: true });
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }

      frameRef.current = 0;
      frameTimerRef.current = setInterval(() => { frameRef.current += 1; }, 50);
      return;
    }

    const id = setTimeout(() => setCount((c) => c - 1), 750);
    return () => clearTimeout(id);
  }, [phase, count, sendSongEnded]);

  useEffect(() => {
    if (phase !== "play") return;

    const loop = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      const p = Math.min(1, elapsed / durationS);
      setProgress(p);

      if (elapsed >= durationS) {
        if (frameTimerRef.current) clearInterval(frameTimerRef.current);
        return;
      }

      const currentFrame = frameRef.current;
      const refHz = pitchRef[currentFrame] ?? 0;
      setTarget(refHz > 0 ? refHzToNorm(refHz) : 0.5);

      const yClose = Math.max(0, 1 - Math.abs(target - youNorm) / 0.25);
      setCombo((c) => (yClose > 0.85 ? c + 1 : 0));

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, durationS, pitchRef, target, youNorm]);

  useEffect(() => {
    if (hz && hz > 0) {
      sendPitchFrame(hz, frameRef.current);
    }
  }, [hz, sendPitchFrame]);

  useEffect(() => {
    if (status === "finished") {
      stopMic();
      audioRef.current?.pause();
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
      cancelAnimationFrame(rafRef.current);
      router.push(`/match/${matchId}/result`);
    }
    return () => {
      audioRef.current?.pause();
      stopMic();
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    };
  }, [status, matchId, router, stopMic]);

  if (status === "connecting" || status === "waiting") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <SoundMark size={56} live color="var(--muted)" />
        <p style={{ color: "var(--muted)" }}>
          {status === "connecting" ? "conectando…" : "aguardando oponente…"}
        </p>
      </div>
    );
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px 26px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <SoundMark size={36} live color={onBeat ? "var(--you)" : "var(--muted)"} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {songTitle ? `${songArtist} — ${songTitle}` : "♪ tocando ao vivo"}
            </div>
            <div className="mono-label">tocando para os dois · não dá pra pausar</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="badge live">
            <span className="dot dot-pulse" />ao vivo
          </div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: "4px 10px", opacity: 0.6 }}
            onClick={() => {
              audioRef.current?.pause();
              router.push("/");
            }}
          >
            desistir
          </button>
        </div>
      </div>

      <div style={{ height: 6, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", marginBottom: 4 }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: "linear-gradient(90deg,var(--you),#d2ff5e)", transition: "width .1s linear" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--faint)", marginBottom: 18 }}>
        <span>{formatDuration(progress * durationS)}</span>
        <span>{combo > 4 ? `combo x${combo}` : "siga a linha cinza"}</span>
        <span>{formatDuration(durationS)}</span>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "center", justifyItems: "center", position: "relative" }}>
        <PitchMeter
          big
          target={target}
          value={youNorm}
          color="var(--you)"
          glow="var(--you-glow)"
          label={(nickname ?? "você").toUpperCase()}
          score={myScore}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: "var(--faint)" }}>VS</div>
          <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "8px 12px", border: "1px dashed var(--border-2)", borderRadius: 10, maxWidth: 130 }}>
            {myScore > opponentScore ? "você na frente 😎" : myScore < opponentScore ? "tá perdendo 😬" : "empate técnico"}
          </div>
        </div>

        <PitchMeter
          big
          target={target}
          value={rivalHz > 0 ? hzToNorm(rivalHz) : 0.5}
          color="var(--rival)"
          glow="var(--rival-glow)"
          label={(rivalName ?? "rival").toUpperCase()}
          score={opponentScore}
        />

        {phase === "tap" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "color-mix(in srgb, var(--bg) 85%, transparent)", backdropFilter: "blur(4px)", borderRadius: 16 }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ fontSize: 22, padding: "18px 48px", fontWeight: 800, letterSpacing: "-0.02em" }}
              onClick={handleTapToStart}
            >
              toque para começar
            </button>
          </div>
        )}

        {phase === "count" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "color-mix(in srgb, var(--bg) 80%, transparent)", backdropFilter: "blur(4px)", borderRadius: 16 }}>
            <div key={count} style={{ fontSize: 120, fontWeight: 800, color: "var(--you)", animation: "pop .7s ease" }}>
              {count > 0 ? count : "biu!"}
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "var(--faint)" }}>
        {isListening
          ? `🎤 microfone ativo · ${hz ? `${hz.toFixed(0)} Hz` : "ouvindo…"}`
          : "🎤 inicializando microfone…"}
      </div>
    </div>
  );
}
