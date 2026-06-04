const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function createWebSocket(path: string, token: string): WebSocket {
  return new WebSocket(`${WS_BASE}${path}?token=${token}`);
}
