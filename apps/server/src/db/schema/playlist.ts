import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const spotifyPlaylist = pgTable("spotify_playlist", {
  id: text("id").primaryKey(), // Spotify playlist ID
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  snapshotId: text("snapshot_id"),
  imagesJson: text("images_json"),
  tracksTotal: integer("tracks_total"),
  ownerName: text("owner_name"),
  href: text("href"),
  uri: text("uri"),
  isPublic: boolean("is_public"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});


