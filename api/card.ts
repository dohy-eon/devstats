import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchUser } from "../src/fetchers/github/user";
import { fetchRepos, summarizeRepos } from "../src/fetchers/github/repos";
import { renderFallbackCard, renderUserCard } from "../src/renderers/card";
import { getTheme } from "../src/themes";

function getString(q: unknown): string | undefined {
  return typeof q === "string" && q.trim() ? q : undefined;
}

function setSvgHeaders(res: VercelResponse): void {
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setSvgHeaders(res);

  const username = getString(req.query.username);
  const theme = getTheme(getString(req.query.theme));

  if (!username) {
    res.status(400).send(renderFallbackCard("Missing `username` query param.", theme));
    return;
  }

  try {
    const [user, repos] = await Promise.all([fetchUser(username), fetchRepos(username, 200)]);
    const stats = summarizeRepos(repos);
    const svg = renderUserCard({ user, stats, theme });
    res.status(200).send(svg);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(200).send(renderFallbackCard(msg, theme));
  }
}

