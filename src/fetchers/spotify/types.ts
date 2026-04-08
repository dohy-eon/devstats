export type SpotifyNowPlaying = {
  status: "profile";
  track: string;
  artists: string;
  url?: string;
  durationMs?: number;
};

