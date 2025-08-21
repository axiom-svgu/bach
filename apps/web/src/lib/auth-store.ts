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
      const res = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("session failed");
      const data = await res.json();
      set({
        accessToken: data?.accessToken ?? null,
        refreshToken: data?.refreshToken ?? null,
        accessTokenExpiresAt: data?.accessTokenExpiresAt ?? null,
        isHydrated: true,
        isAuthenticated: Boolean(data?.authenticated),
      });
    } catch (_) {
      set({
        accessToken: null,
        refreshToken: null,
        accessTokenExpiresAt: null,
        isHydrated: true,
        isAuthenticated: false,
      });
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
