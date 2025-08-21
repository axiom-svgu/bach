import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
});

export function signInWithSpotify() {
  window.location.href = "/api/auth/oauth/spotify";
}
