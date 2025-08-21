import { db } from "../db";
import { account } from "../db/schema/auth";
import { and, eq } from "drizzle-orm";

export async function getSpotifyAccessTokenForUser(
  userId: string
): Promise<string | null> {
  const [row] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "spotify")));

  if (!row) return null;

  const nowMs = Date.now();
  const expiresAtMs = row.accessTokenExpiresAt
    ? new Date(row.accessTokenExpiresAt).getTime()
    : 0;
  const notExpired = expiresAtMs - nowMs > 60_000; // 60s buffer

  if (row.accessToken && notExpired) {
    return row.accessToken;
  }

  if (!row.refreshToken) return row.accessToken ?? null;

  // Refresh token
  const clientId = process.env.SPOTIFY_CLIENT_ID || "";
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: row.refreshToken,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    return row.accessToken ?? null;
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  const newExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);
  await db
    .update(account)
    .set({
      accessToken: data.access_token,
      accessTokenExpiresAt: newExpiresAt,
      refreshToken: data.refresh_token ?? row.refreshToken,
      updatedAt: new Date(),
    })
    .where(and(eq(account.userId, userId), eq(account.providerId, "spotify")));

  return data.access_token;
}

export type SpotifyPlaylistApi = {
  id: string;
  name: string;
  images?: { url: string }[];
  tracks?: { total: number };
  owner?: { display_name?: string };
  href?: string;
  uri?: string;
  public?: boolean;
  snapshot_id?: string;
};

export async function fetchAllUserPlaylists(
  accessToken: string
): Promise<SpotifyPlaylistApi[]> {
  const items: SpotifyPlaylistApi[] = [];
  let next: string | null = `https://api.spotify.com/v1/me/playlists?limit=50`;
  while (next) {
    const res: Response = await fetch(next, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text: string = await res.text();
      throw new Error(`Spotify playlists fetch failed: ${res.status} ${text}`);
    }
    const page: any = await res.json();
    if (Array.isArray(page.items)) items.push(...(page.items as any));
    next = (page.next as string | null) ?? null;
  }
  return items;
}
