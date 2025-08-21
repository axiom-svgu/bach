import { NextRequest, NextResponse } from "next/server";

function generateState(): string {
  // Simple random state, good enough for demo usage
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as any).randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getRequestOrigin(req: NextRequest): string {
  const host = req.headers.get("host");
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  if (host) return `${proto}://${host}`;
  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const scope =
    process.env.SPOTIFY_SCOPES ||
    "user-read-email user-read-private playlist-read-private playlist-read-collaborative";
  if (!clientId) {
    return NextResponse.json(
      { error: "Missing SPOTIFY_CLIENT_ID env var" },
      { status: 500 }
    );
  }

  const state = generateState();
  const origin = getRequestOrigin(req);
  // Use same-origin callback to ensure host/port matches where the flow started
  const redirectUri = `${origin}/api/auth/oauth/spotify/callback`;

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());
  // Persist state for CSRF protection
  res.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return res;
}
