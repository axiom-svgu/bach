"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { trpc } from "@/utils/trpc";

type Playlist = {
  id: string;
  name: string;
  images?: { url: string }[];
  tracksTotal?: number;
  ownerName?: string;
};

export default function Home() {
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc;

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        await utils.playlists.sync.mutate();
        const list = await utils.playlists.list.query();
        if (!ignore) setPlaylists(list as any);
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load playlists");
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [utils]);

  return (
    <ProtectedRoute>
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Your Playlists</h1>
        {!playlists && !error && <div>Loading playlists...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {playlists && playlists.length === 0 && <div>No playlists found.</div>}
        <ul className="grid gap-3">
          {playlists?.map((pl) => (
            <li key={pl.id} className="flex items-center gap-3">
              {pl.images?.[0]?.url && (
                <img
                  src={pl.images[0].url}
                  alt={pl.name}
                  className="h-12 w-12 rounded object-cover"
                />
              )}
              <div className="flex flex-col">
                <span className="font-medium">{pl.name}</span>
                <span className="text-sm text-muted-foreground">
                  {pl.tracksTotal ?? 0} tracks
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ProtectedRoute>
  );
}
