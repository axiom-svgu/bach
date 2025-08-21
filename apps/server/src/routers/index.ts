import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { playlistsRouter } from "./playlists";
import { libraryRouter } from "./library";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  playlists: playlistsRouter,
  library: libraryRouter,
});
export type AppRouter = typeof appRouter;
