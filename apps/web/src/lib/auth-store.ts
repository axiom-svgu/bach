"use client";

import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null; // epoch seconds
  isHydrated: boolean;
  isAuthenticated: boolean;
};

type AuthActions = {
  hydrateFromSession: () => Promise<void>;
  setTokens: (args: {
    accessToken: string | null;
    refreshToken: string | null;
    accessTokenExpiresAt: number | null;
  }) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  accessToken: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
  isHydrated: false,
  isAuthenticated: false,
  async hydrateFromSession() {
    try {
      // Prefer backend session from Hono + better-auth
      const backendUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/session`;
      const res = await fetch(backendUrl, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("session failed");
      const data = await res.json();
      // better-auth session shape: { user, session } when authenticated
      if (data?.session?.token) {
        // Use backend session. We no longer expose spotify tokens directly here.
        set({
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          isHydrated: true,
          isAuthenticated: true,
        });
        return;
      }
      // Fall through to local cookie hydration if backend session is absent
      throw new Error("no backend session");
    } catch (_) {
      // Fallback to existing local Next.js cookie-based session for Spotify
      try {
        const localRes = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "include",
        });
        if (!localRes.ok) throw new Error("local session failed");
        const local = await localRes.json();
        set({
          accessToken: local?.accessToken ?? null,
          refreshToken: local?.refreshToken ?? null,
          accessTokenExpiresAt: local?.accessTokenExpiresAt ?? null,
          isHydrated: true,
          isAuthenticated: Boolean(local?.authenticated),
        });
      } catch {
        set({
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          isHydrated: true,
          isAuthenticated: false,
        });
      }
    }
  },
  setTokens({ accessToken, refreshToken, accessTokenExpiresAt }) {
    const now = Math.floor(Date.now() / 1000);
    const isAuthenticated = Boolean(
      accessToken && accessTokenExpiresAt && accessTokenExpiresAt - now > 0
    );
    set({ accessToken, refreshToken, accessTokenExpiresAt, isAuthenticated });
  },
  clear() {
    set({
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      isHydrated: true,
      isAuthenticated: false,
    });
  },
}));
