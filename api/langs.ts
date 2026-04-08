import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchTopLanguages } from "../src/fetchers/github/languages";
import { renderFallbackLangs, renderLangsCard } from "../src/renderers/langs";
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
    res.status(400).send(renderFallbackLangs("Missing `username` query param.", theme));
    return;
  }

  try {
    const { totalBytes, top } = await fetchTopLanguages(username, { maxRepos: 200, topN: 6 });
    res.status(200).send(renderLangsCard({ username, totalBytes, top, theme }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(200).send(renderFallbackLangs(msg, theme));
  }
}

