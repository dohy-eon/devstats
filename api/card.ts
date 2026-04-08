import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchUser } from "../src/fetchers/github/user";
import { fetchActivityStats } from "../src/fetchers/github/activity";
import { fetchTopLanguages } from "../src/fetchers/github/languages";
import { fetchStreak } from "../src/fetchers/github/streak";
import { renderFallbackCard, renderUserCard } from "../src/renderers/card";
import { resolveTheme } from "../src/themes";
import { normalizeHexColor } from "../src/utils/svg";

function getString(q: unknown): string | undefined {
  return typeof q === "string" && q.trim() ? q : undefined;
}

function setSvgHeaders(res: VercelResponse): void {
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
}

function getInt(q: unknown): number | undefined {
  if (typeof q !== "string") return undefined;
  const n = Number.parseInt(q, 10);
  return Number.isFinite(n) ? n : undefined;
}

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function pickThemeOverrides(req: VercelRequest): {
  bg?: string;
  title?: string;
  text?: string;
  muted?: string;
  accent?: string;
  border?: string;
} {
  const out: {
    bg?: string;
    title?: string;
    text?: string;
    muted?: string;
    accent?: string;
    border?: string;
  } = {};

  const bg = normalizeHexColor(getString(req.query.bg_color)) ?? normalizeHexColor(getString(req.query.bg));
  if (bg) out.bg = bg;

  const title = normalizeHexColor(getString(req.query.title_color)) ?? normalizeHexColor(getString(req.query.title));
  if (title) out.title = title;

  const text = normalizeHexColor(getString(req.query.text_color)) ?? normalizeHexColor(getString(req.query.text));
  if (text) out.text = text;

  const muted = normalizeHexColor(getString(req.query.muted_color)) ?? normalizeHexColor(getString(req.query.muted));
  if (muted) out.muted = muted;

  const accent =
    normalizeHexColor(getString(req.query.icon_color)) ?? normalizeHexColor(getString(req.query.accent_color));
  if (accent) out.accent = accent;

  const border =
    normalizeHexColor(getString(req.query.border_color)) ?? normalizeHexColor(getString(req.query.border));
  if (border) out.border = border;

  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setSvgHeaders(res);

  const username = getString(req.query.username);
  const theme = resolveTheme(getString(req.query.theme) ?? "xai", pickThemeOverrides(req));
  const current = getInt(req.query.current);
  const longest = getInt(req.query.longest);
  const year = getInt(req.query.year);
  const width = getInt(req.query.width);
  const height = getInt(req.query.height);
  const size: { width?: number; height?: number } = {};
  if (width !== undefined) size.width = clampInt(width, 320, 1200);
  if (height !== undefined) size.height = clampInt(height, 180, 1200);

  if (!username) {
    res.status(400).send(renderFallbackCard("Missing `username` query param.", theme, size));
    return;
  }

  try {
    const effectiveYear = year ?? new Date().getUTCFullYear();
    const streakPromise =
      current !== undefined && longest !== undefined
        ? Promise.resolve({ current, longest })
        : fetchStreak(username)
            .then((s) => ({
              current: current ?? s.current,
              longest: longest ?? s.longest
            }))
            .catch(() => ({
              current: current ?? 0,
              longest: longest ?? 0
            }));

    const [user, activity, langs, streak] = await Promise.all([
      fetchUser(username),
      fetchActivityStats(username, effectiveYear),
      fetchTopLanguages(username, { maxRepos: 200, topN: 5 }),
      streakPromise
    ]);

    const svg = renderUserCard({
      user,
      activity,
      langs,
      year: effectiveYear,
      streak,
      theme,
      ...(width !== undefined ? { width: clampInt(width, 320, 1200) } : {}),
      ...(height !== undefined ? { height: clampInt(height, 180, 1200) } : {})
    });
    res.status(200).send(svg);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(200).send(renderFallbackCard(msg, theme, size));
  }
}

