import { NextRequest, NextResponse } from "next/server";

// This route now simply redirects to the backend Better Auth Spotify starter.
export async function GET(_req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!base) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SERVER_URL" },
      { status: 500 }
    );
  }
  const redirect = new URL("/api/auth/social/spotify", base);
  return NextResponse.redirect(redirect.toString());
}
