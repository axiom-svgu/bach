import { NextRequest, NextResponse } from "next/server";

// The backend handles the Spotify callback now. We only redirect to home.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  return NextResponse.redirect(new URL("/", url).toString());
}
