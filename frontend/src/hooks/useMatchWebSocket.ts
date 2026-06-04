"use client";

import { getAccessToken } from "@/lib/auth";
import { createWebSocket } from "@/lib/ws";
import { useCallback, useEffect, useRef, useState } from "react";

interface MatchState {
  status: "connecting" | "waiting" | "playing" | "finished";
  songUrl: string | null;
  songTitle: string | null;
  songArtist: string | null;
  durationMs: number | null;
  pitchRef: number[];
  rivalName: string | null;
  myScore: number;
  opponentScore: number;
  rivalHz: number;
  winnerId: string | null;
}

interface UseMatchWebSocketReturn extends MatchState {
  sendPitchFrame: (hz: number, frame: number) => void;
  sendSongEnded: () => void;
}

export function useMatchWebSocket(matchId: string): UseMatchWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<MatchState>({
    status: "connecting",
    songUrl: null,
    songTitle: null,
    songArtist: null,
    durationMs: null,
    pitchRef: [],
    rivalName: null,
    myScore: 0,
    opponentScore: 0,
    rivalHz: 0,
    winnerId: null,
  });
  const myUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      myUserIdRef.current = String(payload.user_id);
    } catch {}

    const ws = createWebSocket(`/ws/match/${matchId}/`, token);
    wsRef.current = ws;

    ws.onopen = () => setState((s) => ({ ...s, status: "waiting" }));

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "match_start") {
        const myId = myUserIdRef.current;
        const players: Record<string, string> = data.players ?? {};
        const rivalName = myId
          ? (Object.entries(players).find(([k]) => k !== myId)?.[1] ?? null)
          : null;
        setState((s) => ({
          ...s,
          status: "playing",
          songUrl: data.song_url,
          songTitle: data.song_title ?? null,
          songArtist: data.song_artist ?? null,
          durationMs: data.duration_ms,
          pitchRef: data.pitch_ref ?? [],
          rivalName,
        }));
      }

      if (data.type === "pitch_update") {
        const myId = myUserIdRef.current;
        if (String(data.player_id) !== myId) {
          setState((s) => ({ ...s, rivalHz: data.hz ?? 0 }));
        }
      }

      if (data.type === "score_update") {
        const myId = myUserIdRef.current;
        if (String(data.player_id) === myId) {
          setState((s) => ({ ...s, myScore: data.score }));
        } else {
          setState((s) => ({ ...s, opponentScore: data.score }));
        }
      }

      if (data.type === "match_end") {
        const myId = myUserIdRef.current;
        const scores: Record<string, number> = data.scores;
        setState((s) => ({
          ...s,
          status: "finished",
          myScore: myId ? (scores[myId] ?? 0) : 0,
          opponentScore: myId
            ? (Object.entries(scores).find(([k]) => k !== myId)?.[1] ?? 0)
            : 0,
          winnerId: data.winner_id,
        }));
      }
    };

    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, [matchId]);

  const sendPitchFrame = useCallback((hz: number, frame: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "pitch_frame", hz, frame }));
    }
  }, []);

  const sendSongEnded = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "song_ended" }));
    }
  }, []);

  return { ...state, sendPitchFrame, sendSongEnded };
}
