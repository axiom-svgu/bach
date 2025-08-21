import { db } from "../db";
import { account } from "../db/schema/auth";
import { and, eq } from "drizzle-orm";
import SpotifyWebApi from "spotify-web-api-node";
import { env } from "../lib/env";

export function createSpotifyApiClient(args?: {
  accessToken?: string;
  refreshToken?: string;
}) {
  const api = new SpotifyWebApi({
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
    refreshToken: args?.refreshToken,
  });
  if (args?.accessToken) api.setAccessToken(args.accessToken);
  return api;
}

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

  // Refresh token via Spotify SDK
  const api = createSpotifyApiClient({
    refreshToken: row.refreshToken ?? undefined,
  });
  try {
    const { body } = await api.refreshAccessToken();
    const accessToken = body.access_token as string;
    const expiresIn = (body.expires_in as number) ?? 3600;
    const newRefreshToken =
      (body.refresh_token as string | undefined) ??
      row.refreshToken ??
      undefined;
    const newExpiresAt = new Date(Date.now() + (expiresIn - 60) * 1000);
    await db
      .update(account)
      .set({
        accessToken,
        accessTokenExpiresAt: newExpiresAt,
        refreshToken: newRefreshToken,
        updatedAt: new Date(),
      })
      .where(
        and(eq(account.userId, userId), eq(account.providerId, "spotify"))
      );
    return accessToken;
  } catch {
    return row.accessToken ?? null;
  }
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
  const api = createSpotifyApiClient({ accessToken });
  const items: SpotifyPlaylistApi[] = [];
  let limit = 50;
  let offset = 0;
  while (true) {
    const { body } = await api.getUserPlaylists({ limit, offset });
    if (Array.isArray(body.items)) items.push(...(body.items as any));
    if (!body.next) break;
    offset += limit;
  }
  return items;
}
