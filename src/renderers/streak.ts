import type { SvgTheme } from "../utils/svg";
import { escapeXml, roundedRect, svgDoc, textEl, uiBadge, uiStatBlock, uiStyle, xaiTokens } from "../utils/svg";

export type StreakInput = {
  username: string;
  current: number;
  longest: number;
  theme: SvgTheme;
};

export function renderStreakCard(input: StreakInput): string {
  const width = 460;
  const height = 170;
  const { username, current, longest, theme } = input;
  const tokens = xaiTokens();
  const pad = 24;
  const contentW = width - pad * 2;
  const statGap = 24;
  const statW = (contentW - statGap) / 2;

  const body: string[] = [];
  body.push(roundedRect(0, 0, width, height, 4, { fill: tokens.bg, stroke: tokens.border, strokeWidth: 1 }));
  body.push(
    `<text x="${pad}" y="${pad}" class="mono" fill="${tokens.text}" font-size="18" font-weight="700" dominant-baseline="hanging">${escapeXml(
      username
    )}</text>`
  );
  body.push(`<text x="${width - pad}" y="${pad}" class="mono cap" fill="${tokens.textMuted}" font-size="11" font-weight="500" text-anchor="end" dominant-baseline="hanging">STREAK</text>`);

  const statY = pad + 42;
  body.push(uiStatBlock(pad, statY, "CURRENT DAYS", `${current}`, tokens, { width: statW, valueSize: 24 }));
  body.push(uiStatBlock(pad + statW + statGap, statY, "LONGEST DAYS", `${longest}`, tokens, { width: statW, valueSize: 24 }));
  body.push(roundedRect(pad, statY + 58, contentW, 1, 0, { fill: tokens.border }));

  const badgeText = `RATIO ${longest > 0 ? Math.round((current / longest) * 100) : 0}% OF BEST`;
  const badgeW = Math.ceil(8 * 2 + badgeText.length * 12 * 0.62);
  const badgeX = pad + Math.max(0, (contentW - badgeW) / 2);
  body.push(uiBadge(badgeX, statY + 74, badgeText, tokens));

  const style = uiStyle();
  return svgDoc(
    {
      width,
      height,
      theme: { ...theme, bg: tokens.bg, border: tokens.border, title: tokens.text, text: tokens.text, muted: tokens.textMuted, accent: "#ffffff" },
      borderRadius: 4
    },
    body.join(""),
    { style }
  );
}

export function renderFallbackStreak(message: string, theme: SvgTheme): string {
  const width = 460;
  const height = 140;
  const body = [
    textEl("Streak", 18, 34, { fill: theme.title, fontSize: 16, fontWeight: 800 }),
    textEl("요청을 처리하지 못했습니다.", 18, 62, { fill: theme.text, fontSize: 12, fontWeight: 600 }),
    textEl(message, 18, 84, { fill: theme.muted, fontSize: 11, fontWeight: 500, opacity: 0.9 })
  ].join("");
  return svgDoc({ width, height, theme }, body);
}


