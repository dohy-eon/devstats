import type { VercelRequest, VercelResponse } from "@vercel/node";
import { renderFallbackStreak, renderStreakCard } from "../src/renderers/streak";
import { getTheme } from "../src/themes";

function getString(q: unknown): string | undefined {
  return typeof q === "string" && q.trim() ? q : undefined;
}

function getInt(q: unknown): number | undefined {
  if (typeof q !== "string") return undefined;
  const n = Number.parseInt(q, 10);
  return Number.isFinite(n) ? n : undefined;
}

function setSvgHeaders(res: VercelResponse): void {
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setSvgHeaders(res);

  const username = getString(req.query.username);
  const theme = getTheme(getString(req.query.theme));
  const current = getInt(req.query.current);
  const longest = getInt(req.query.longest);

  if (!username) {
    res.status(400).send(renderFallbackStreak("Missing `username` query param.", theme));
    return;
  }
  if (current === undefined || longest === undefined) {
    res.status(400).send(renderFallbackStreak("Missing `current` or `longest` query param.", theme));
    return;
  }
  if (current < 0 || longest < 0) {
    res.status(400).send(renderFallbackStreak("`current` and `longest` must be >= 0.", theme));
    return;
  }

  try {
    res.status(200).send(renderStreakCard({ username, current, longest, theme }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(200).send(renderFallbackStreak(msg, theme));
  }
}

