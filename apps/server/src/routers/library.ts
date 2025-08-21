import { protectedProcedure, router } from "../lib/trpc";
import { z } from "zod";
import { db } from "../db";
import { category, playlistCategory } from "../db/schema/category";
import { tag, playlistTag } from "../db/schema/tag";
import { eq, and, inArray } from "drizzle-orm";

function newId() {
  return (
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  );
}

export const libraryRouter = router({
  // Categories
  createCategory: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(120) }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const id = newId();
      await db.insert(category).values({
        id,
        userId: ctx.session.user.id,
        name: input.name,
        createdAt: now,
        updatedAt: now,
      });
      return { id };
    }),

  listCategories: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(category)
      .where(eq(category.userId, ctx.session.user.id));
  }),

  assignCategory: protectedProcedure
    .input(z.object({ playlistId: z.string(), categoryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      await db
        .insert(playlistCategory)
        .values({
          playlistId: input.playlistId,
          categoryId: input.categoryId,
          userId: ctx.session.user.id,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [playlistCategory.playlistId, playlistCategory.categoryId],
          set: { updatedAt: now },
        });
      return { ok: true };
    }),

  removeCategory: protectedProcedure
    .input(z.object({ playlistId: z.string(), categoryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(playlistCategory)
        .where(
          and(
            eq(playlistCategory.userId, ctx.session.user.id),
            eq(playlistCategory.playlistId, input.playlistId),
            eq(playlistCategory.categoryId, input.categoryId)
          )
        );
      return { ok: true };
    }),

  // Tags
  createTag: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(120) }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const id = newId();
      await db.insert(tag).values({
        id,
        userId: ctx.session.user.id,
        name: input.name,
        createdAt: now,
        updatedAt: now,
      });
      return { id };
    }),

  listTags: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(tag).where(eq(tag.userId, ctx.session.user.id));
  }),

  setPlaylistTags: protectedProcedure
    .input(z.object({ playlistId: z.string(), tagIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      // Remove existing
      await db
        .delete(playlistTag)
        .where(
          and(
            eq(playlistTag.userId, ctx.session.user.id),
            eq(playlistTag.playlistId, input.playlistId)
          )
        );
      // Add new
      const now = new Date();
      if (input.tagIds.length) {
        await db.insert(playlistTag).values(
          input.tagIds.map((tagId) => ({
            playlistId: input.playlistId,
            tagId,
            userId: ctx.session.user.id,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }
      return { ok: true };
    }),

  listPlaylistTags: protectedProcedure
    .input(z.object({ playlistId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select()
        .from(playlistTag)
        .where(
          and(
            eq(playlistTag.userId, ctx.session.user.id),
            eq(playlistTag.playlistId, input.playlistId)
          )
        );
      return rows;
    }),
});
