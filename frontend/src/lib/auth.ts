import { jwtDecode } from "jwt-decode";
import { api } from "./api";

interface JWTPayload {
  user_id: number;
  email: string;
  exp: number;
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getUser(): JWTPayload | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = jwtDecode<JWTPayload>(token);
    // simplejwt serializes user_id como string — garantir number para comparações com player_id da API
    return { ...payload, user_id: Number(payload.user_id) };
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const user = getUser();
  if (!user) return false;
  return user.exp * 1000 > Date.now();
}

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login/", { email, password });
  setTokens(data.access, data.refresh);
  return data;
}

export function getNickname(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nickname");
}

export function storeNickname(nickname: string) {
  localStorage.setItem("nickname", nickname);
}

export async function register(
  email: string,
  password: string,
  nickname: string,
) {
  const { data } = await api.post("/auth/register/", {
    email,
    password,
    nickname,
  });
  storeNickname(nickname);
  return data;
}

export async function logout() {
  const refresh = localStorage.getItem("refresh_token");
  if (refresh) {
    await api.post("/auth/logout/", { refresh }).catch(() => {});
  }
  clearTokens();
}
