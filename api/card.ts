import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchUser } from "../src/fetchers/github/user";
import { fetchRepos, summarizeRepos } from "../src/fetchers/github/repos";
import { renderFallbackCard, renderUserCard } from "../src/renderers/card";
import type { CardMetricKey } from "../src/renderers/card";
import { resolveTheme } from "../src/themes";
import { normalizeHexColor } from "../src/utils/svg";

function getString(q: unknown): string | undefined {
  return typeof q === "string" && q.trim() ? q : undefined;
}

function parseHideSet(hide: string | undefined): ReadonlySet<CardMetricKey> {
  const out = new Set<CardMetricKey>();
  if (!hide) return out;
  const parts = hide
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  for (const p of parts) {
    if (p === "stars") out.add("stars");
    else if (p === "forks") out.add("forks");
    else if (p === "followers") out.add("followers");
    else if (p === "contribs" || p === "contributions") out.add("contribs");
  }
  return out;
}

function setSvgHeaders(res: VercelResponse): void {
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
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
  const theme = resolveTheme(getString(req.query.theme), pickThemeOverrides(req));
  const hide = parseHideSet(getString(req.query.hide));

  if (!username) {
    res.status(400).send(renderFallbackCard("Missing `username` query param.", theme));
    return;
  }

  try {
    const [user, repos] = await Promise.all([fetchUser(username), fetchRepos(username, 200)]);
    const stats = summarizeRepos(repos);
    const svg = renderUserCard({ user, stats, theme, hide });
    res.status(200).send(svg);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(200).send(renderFallbackCard(msg, theme));
  }
}

