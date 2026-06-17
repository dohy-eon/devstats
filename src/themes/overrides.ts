import type { ThemeOverrides } from "./index";
import { normalizeHexColor } from "../utils/svg";

function getString(q: unknown): string | undefined {
  return typeof q === "string" && q.trim() ? q : undefined;
}

export function pickThemeOverrides(query: Record<string, unknown>): ThemeOverrides {
  const out: ThemeOverrides = {};

  const bg = normalizeHexColor(getString(query.bg_color)) ?? normalizeHexColor(getString(query.bg));
  if (bg) out.bg = bg;

  const title = normalizeHexColor(getString(query.title_color)) ?? normalizeHexColor(getString(query.title));
  if (title) out.title = title;

  const text = normalizeHexColor(getString(query.text_color)) ?? normalizeHexColor(getString(query.text));
  if (text) out.text = text;

  const muted = normalizeHexColor(getString(query.muted_color)) ?? normalizeHexColor(getString(query.muted));
  if (muted) out.muted = muted;

  const accent =
    normalizeHexColor(getString(query.icon_color)) ?? normalizeHexColor(getString(query.accent_color));
  if (accent) out.accent = accent;

  const border =
    normalizeHexColor(getString(query.border_color)) ?? normalizeHexColor(getString(query.border));
  if (border) out.border = border;

  return out;
}
