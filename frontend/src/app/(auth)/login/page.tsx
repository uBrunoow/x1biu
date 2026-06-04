"use client";

import { Wordmark } from "@/components/wordmark";
import { login } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch {
      toast.error("Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <Wordmark size={22} sub="batalha de assobios" />
      </div>

      <div className="card" style={{ padding: 28, width: "min(400px, 92vw)" }}>
        <div className="mono-label" style={{ marginBottom: 20 }}>
          entrar na conta
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <input
            className="x-input"
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="x-input"
            type="password"
            placeholder="senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 4, justifyContent: "center" }}
          >
            {loading ? "entrando…" : "entrar →"}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 20, fontSize: 13, color: "var(--faint)" }}>
        sem conta?{" "}
        <Link
          href="/register"
          style={{ color: "var(--muted)", textDecoration: "underline" }}
        >
          criar uma
        </Link>
      </p>
    </div>
  );
}
