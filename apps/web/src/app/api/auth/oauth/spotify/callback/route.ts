import { NextRequest, NextResponse } from "next/server";

async function exchangeCodeForToken({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
  };
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
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = req.cookies.get("spotify_oauth_state")?.value;

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", url).toString()
    );
  }
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/login?error=state_mismatch", url).toString()
    );
  }

  // Reconstruct redirectUri to match what was used during authorization
  const redirectUri = `${getRequestOrigin(
    req
  )}/api/auth/oauth/spotify/callback`;

  try {
    const token = await exchangeCodeForToken({ code, redirectUri });

    const res = NextResponse.redirect(
      new URL("/", getRequestOrigin(req)).toString()
    );
    // Store tokens in httpOnly cookies for now; you can later integrate with your session layer
    res.cookies.set("spotify_access_token", token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: token.expires_in - 60,
    });
    if (token.refresh_token) {
      res.cookies.set("spotify_refresh_token", token.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    // Persist access token expiry epoch seconds for client hydration
    const accessTokenExpiresAt =
      Math.floor(Date.now() / 1000) + token.expires_in - 60;
    res.cookies.set("spotify_access_expires_at", String(accessTokenExpiresAt), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: token.expires_in - 60,
    });
    // Clear one-time state cookie
    res.cookies.set("spotify_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    return NextResponse.redirect(
      new URL("/login?error=token_exchange_failed", url).toString()
    );
  }
}
