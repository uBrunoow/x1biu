"use client";

import { getNickname, getUser, isAuthenticated, logout } from "@/lib/auth";
import { useEffect, useState } from "react";

interface AuthUser {
  user_id: number;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      const u = getUser() as AuthUser;
      setUser(u);
      setNickname(getNickname() ?? u.email?.split("@")[0] ?? "");
    }
    setLoading(false);
  }, []);

  async function signOut() {
    await logout();
    setUser(null);
    setNickname(null);
    window.location.href = "/login";
  }

  return { user, nickname, loading, signOut };
}
