const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "wss://veronique-maniform-nonboastingly.ngrok-free.dev";

export function createWebSocket(path: string, token: string): WebSocket {
  return new WebSocket(`${WS_BASE}${path}?token=${token}`);
}
