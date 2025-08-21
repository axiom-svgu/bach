import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
});

export function signInWithSpotify() {
  // Redirect to backend Better Auth social sign-in for Spotify
  const base = process.env.NEXT_PUBLIC_SERVER_URL;
  const redirect = new URL("/api/auth/social/spotify", base);
  window.location.href = redirect.toString();
}
