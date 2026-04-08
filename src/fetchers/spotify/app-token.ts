function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export async function fetchSpotifyAppAccessToken(): Promise<string> {
  const clientId = requiredEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = requiredEnv("SPOTIFY_CLIENT_SECRET");

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const json = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok) {
    const msg = json.error_description ?? json.error ?? `Spotify token error (${res.status})`;
    throw new Error(msg);
  }
  if (!json.access_token) throw new Error("Spotify token response missing access_token");
  return json.access_token;
}

