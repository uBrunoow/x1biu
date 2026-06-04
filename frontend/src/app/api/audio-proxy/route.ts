import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  const upstream = await fetch(url, {
    headers: { "ngrok-skip-browser-warning": "true" },
  });

  if (!upstream.ok) {
    return new NextResponse("Upstream error", { status: upstream.status });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
      "Accept-Ranges": "bytes",
    },
  });
}
