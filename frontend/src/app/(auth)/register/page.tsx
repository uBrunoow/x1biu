"use client";

import { Wordmark } from "@/components/wordmark";
import { login, register } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, nickname);
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (
          err as {
            response?: { data?: { nickname?: string[]; email?: string[] } };
          }
        ).response?.data?.nickname?.[0] ??
        (err as { response?: { data?: { email?: string[] } } }).response?.data
          ?.email?.[0] ??
        "Erro ao criar conta";
      toast.error(msg);
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
        <Wordmark size={22} sub="criar conta" />
      </div>

      <div className="card" style={{ padding: 28, width: "min(400px, 92vw)" }}>
        <div className="mono-label" style={{ marginBottom: 20 }}>
          nova conta
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
            placeholder="apelido (exibido no ranking)"
            value={nickname}
            maxLength={14}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
          <input
            className="x-input"
            type="password"
            placeholder="senha (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 4, justifyContent: "center" }}
          >
            {loading ? "criando conta…" : "criar conta →"}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 20, fontSize: 13, color: "var(--faint)" }}>
        já tem conta?{" "}
        <Link
          href="/login"
          style={{ color: "var(--muted)", textDecoration: "underline" }}
        >
          entrar
        </Link>
      </p>
    </div>
  );
}
