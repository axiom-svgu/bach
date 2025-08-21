import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { spotifyPlaylist } from "./playlist";

export const tag = pgTable("tag", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const playlistTag = pgTable(
  "playlist_tag",
  {
    playlistId: text("playlist_id")
      .notNull()
      .references(() => spotifyPlaylist.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.playlistId, t.tagId] }),
  })
);
