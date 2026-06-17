import type { VercelRequest, VercelResponse } from "@vercel/node";
import { renderFallbackStreak, renderStreakCard } from "../src/renderers/streak";
import { fetchStreak } from "../src/fetchers/github/streak";
import { resolveTheme } from "../src/themes";
import { pickThemeOverrides } from "../src/themes/overrides";

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
  const theme = resolveTheme(getString(req.query.theme) ?? "xai", pickThemeOverrides(req.query as Record<string, unknown>));
  const current = getInt(req.query.current);
  const longest = getInt(req.query.longest);

  if (!username) {
    res.status(400).send(renderFallbackStreak("Missing `username` query param.", theme));
    return;
  }

  try {
    const streak =
      current !== undefined && longest !== undefined
        ? { current, longest }
        : await fetchStreak(username).then((s) => ({
            current: current ?? s.current,
            longest: longest ?? s.longest
          }));

    if (streak.current < 0 || streak.longest < 0) {
      res.status(400).send(renderFallbackStreak("`current` and `longest` must be >= 0.", theme));
      return;
    }

    res.status(200).send(renderStreakCard({ username, current: streak.current, longest: streak.longest, theme }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(200).send(renderFallbackStreak(msg, theme));
  }
}

