import { protectedProcedure, router } from "../lib/trpc";
import { z } from "zod";
import {
  getSpotifyAccessTokenForUser,
  fetchAllUserPlaylists,
} from "../lib/spotify";
import { db } from "../db";
import { spotifyPlaylist } from "../db/schema/playlist";
import { and, eq } from "drizzle-orm";

export const playlistsRouter = router({
  sync: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const accessToken = await getSpotifyAccessTokenForUser(userId);
    if (!accessToken) {
      throw new Error("No Spotify account linked or token unavailable");
    }
    const items = await fetchAllUserPlaylists(accessToken);

    const now = new Date();
    // Upsert all playlists
    for (const p of items) {
      await db
        .insert(spotifyPlaylist)
        .values({
          id: p.id,
          userId,
          name: p.name,
          snapshotId: p.snapshot_id,
          imagesJson: JSON.stringify(p.images ?? []),
          tracksTotal: p.tracks?.total ?? null,
          ownerName: p.owner?.display_name ?? null,
          href: p.href ?? null,
          uri: p.uri ?? null,
          isPublic: typeof p.public === "boolean" ? p.public : null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: spotifyPlaylist.id,
          set: {
            name: p.name,
            snapshotId: p.snapshot_id,
            imagesJson: JSON.stringify(p.images ?? []),
            tracksTotal: p.tracks?.total ?? null,
            ownerName: p.owner?.display_name ?? null,
            href: p.href ?? null,
            uri: p.uri ?? null,
            isPublic: typeof p.public === "boolean" ? p.public : null,
            updatedAt: now,
          },
        });
    }

    return { synced: items.length };
  }),

  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const rows = await db
        .select()
        .from(spotifyPlaylist)
        .where(eq(spotifyPlaylist.userId, userId));
      let result = rows;
      if (input?.search) {
        const q = input.search.toLowerCase();
        result = rows.filter((r) => r.name.toLowerCase().includes(q));
      }
      return result.map((r) => ({
        id: r.id,
        name: r.name,
        images: JSON.parse(r.imagesJson || "[]") as { url: string }[],
        tracksTotal: r.tracksTotal ?? 0,
        ownerName: r.ownerName ?? undefined,
      }));
    }),
});
