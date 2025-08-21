"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/lib/auth-store";

type Playlist = {
  id: string;
  name: string;
  images?: { url: string }[];
  tracks?: { total: number };
  owner?: { display_name?: string };
};

export default function Home() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!accessToken) return;
      try {
        const res = await fetch(
          "https://api.spotify.com/v1/me/playlists?limit=50",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`${res.status} ${text}`);
        }
        const data = await res.json();
        if (!ignore) setPlaylists(data.items || []);
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load playlists");
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

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
                  {pl.tracks?.total ?? 0} tracks
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ProtectedRoute>
  );
}
