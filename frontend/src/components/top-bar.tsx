"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "./wordmark";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { nickname } = useAuth();

  const tabs = [
    { id: "/", label: "início" },
    { id: "/ranking", label: "ranking" },
    ...(nickname ? [{ id: "/history", label: "histórico" }] : []),
  ];

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 26px",
        borderBottom: "1px solid var(--border)",
        background: "color-mix(in srgb, var(--bg) 75%, transparent)",
        backdropFilter: "blur(10px)",
        flexShrink: 0,
      }}
    >
      <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
        <Wordmark size={19} />
      </Link>
      <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className="btn btn-ghost btn-sm"
            onClick={() => router.push(t.id)}
            style={
              pathname === t.id
                ? { color: "var(--you)", borderColor: "var(--you-dim)" }
                : {}
            }
          >
            {t.label}
          </button>
        ))}
        <div className="badge you" style={{ marginLeft: 8 }}>
          <span className="dot" />
          {nickname ?? "convidado"}
        </div>
      </nav>
    </header>
  );
}
