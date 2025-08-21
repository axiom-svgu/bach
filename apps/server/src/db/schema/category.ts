import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { spotifyPlaylist } from "./playlist";

export const category = pgTable("category", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const playlistCategory = pgTable(
  "playlist_category",
  {
    playlistId: text("playlist_id")
      .notNull()
      .references(() => spotifyPlaylist.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.playlistId, t.categoryId] }),
  })
);
