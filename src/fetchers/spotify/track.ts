import type { SpotifyNowPlaying } from "./types";
import { fetchSpotifyAppAccessToken } from "./app-token";

type TrackResponse = {
  name: string;
  duration_ms: number;
  external_urls?: { spotify?: string };
  artists: Array<{ name: string }>;
};

function parseSpotifyTrackId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // spotify:track:<id>
  const uriMatch = /^spotify:track:([a-zA-Z0-9]{22})$/.exec(raw);
  if (uriMatch) return uriMatch[1] ?? null;

  // https://open.spotify.com/track/<id>?...
  try {
    const url = new URL(raw);
    if (url.hostname.endsWith("spotify.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("track");
      const id = idx >= 0 ? parts[idx + 1] : undefined;
      if (id && /^[a-zA-Z0-9]{22}$/.test(id)) return id;
    }
  } catch {
    // ignore
  }

  // plain id
  if (/^[a-zA-Z0-9]{22}$/.test(raw)) return raw;
  return null;
}

function joinArtists(artists: Array<{ name: string }>): string {
  return artists.map((a) => a.name).filter(Boolean).join(", ");
}

export async function fetchSpotifyTrackAsProfileMusic(trackInput: string): Promise<SpotifyNowPlaying | null> {
  const id = parseSpotifyTrackId(trackInput);
  if (!id) return null;

  const token = await fetchSpotifyAppAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const t = (await res.json()) as TrackResponse;
  if (!t?.name) return null;

  return {
    status: "profile",
    track: t.name,
    artists: joinArtists(t.artists ?? []),
    durationMs: t.duration_ms,
    ...(t.external_urls?.spotify ? { url: t.external_urls.spotify } : {})
  };
}

