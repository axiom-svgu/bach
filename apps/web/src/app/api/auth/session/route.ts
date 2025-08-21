import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get("spotify_access_token")?.value || null;
  const refreshToken = req.cookies.get("spotify_refresh_token")?.value || null;
  const expiresAtCookie =
    req.cookies.get("spotify_access_expires_at")?.value || null;
  const accessTokenExpiresAt = expiresAtCookie ? Number(expiresAtCookie) : null;
  const now = Math.floor(Date.now() / 1000);
  const notExpired =
    accessToken && accessTokenExpiresAt
      ? accessTokenExpiresAt - now > 0
      : false;

  if (!accessToken || !notExpired) {
    return NextResponse.json(
      {
        authenticated: false,
        accessToken: null,
        refreshToken: null,
        accessTokenExpiresAt: null,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
    },
    { status: 200 }
  );
}
