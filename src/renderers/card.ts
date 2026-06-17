import type { GitHubUser } from "../fetchers/github/user";
import type { GitHubActivityStats } from "../fetchers/github/activity";
import type { LanguageStat } from "../fetchers/github/languages";
import type { SpotifyNowPlaying } from "../fetchers/spotify/types";
import type { SvgTheme } from "../utils/svg";
import { clamp, escapeXml, roundedRect, svgDoc, textEl, uiBadge, uiStatBlock, uiStyle, themeToTokens } from "../utils/svg";

function isHexColor(input: unknown): input is string {
  if (typeof input !== "string") return false;
  const s = input.trim();
  return /^#([0-9a-fA-F]{6})$/.test(s) || /^#([0-9a-fA-F]{3})$/.test(s);
}

export function renderUserCard(input: {
  user: GitHubUser;
  activity: GitHubActivityStats;
  langs: { totalBytes: number; top: LanguageStat[] };
  streak: { current: number; longest: number };
  nowPlaying?: SpotifyNowPlaying;
  year: number | string;
  theme: SvgTheme;
  width?: number;
  height?: number;
}): string {
  const width = input.width ?? 560;
  const height = input.height ?? 300;
  const tokens = themeToTokens(input.theme);
  const compact = height <= 200;
  const tiny = height <= 190;
  const pad = tiny ? 16 : compact ? 24 : 32;
  const space = 8;

  const body: string[] = [];
  const contentW = width - pad * 2;
  const leftX = pad;
  const topY = pad;
  const sectionGap = space * 2;
  const clampText = (s: string, maxChars: number) => (s.length > maxChars ? `${s.slice(0, Math.max(0, maxChars - 1))}…` : s);

  const style = `
    ${uiStyle()}
    .bodyText { font-family: ${escapeXml('Inter, "SF Pro Display", "Avenir Next", "Helvetica Neue", "Pretendard Variable", Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif')}; }
  `;

  const heroStatY = topY + (tiny ? 48 : 56);
  const statGap = space * 2;
  const colW = (contentW - 2 * statGap) / 3;
  const prLabel = colW < 72 ? "PRS" : "PULL REQUESTS";
  const col1X = leftX;
  const col2X = leftX + colW + statGap;
  const col3X = leftX + 2 * (colW + statGap);
  const periodText = `CONTRIBUTIONS · ${input.year}`;
  const barH = 6;
  const barY = height - pad - barH;
  const langLabelY = barY - 14;

  // Identity area
  body.push(
    `<text x="${leftX}" y="${topY}" class="mono" fill="${escapeXml(tokens.text)}" font-size="${compact ? 18 : 20}" font-weight="700" dominant-baseline="hanging">${escapeXml(
      `@${input.user.login}`
    )}</text>`
  );
  if (input.nowPlaying) {
    const nowPlayingX = leftX + contentW * 0.54;
    const maxChars = Math.max(16, Math.floor((contentW * 0.44) / (tiny ? 6.6 : 6.9)));
    const badgeText = clampText(`♪ ${input.nowPlaying.track} — ${input.nowPlaying.artists}`, maxChars);
    body.push(
      `<text x="${nowPlayingX}" y="${topY}" class="bodyText" fill="${escapeXml(tokens.textSecondary)}" font-size="12" font-weight="400" text-anchor="start" dominant-baseline="hanging">${escapeXml(badgeText)}</text>`
    );
  }
  body.push(
    `<text x="${leftX}" y="${topY + 24}" class="mono cap" fill="${escapeXml(tokens.textMuted)}" font-size="10" font-weight="500" dominant-baseline="hanging">${escapeXml(
      periodText
    )}</text>`
  );

  // Performance area
  const heroValueSize = tiny ? 16 : compact ? 20 : 24;
  const statInsetX = tiny ? 2 : 4;
  body.push(
    uiStatBlock(col1X, heroStatY, "COMMITS", input.activity.totalCommits.toLocaleString("en-US"), tokens, {
      width: colW,
      valueSize: heroValueSize,
      align: "start",
      insetX: statInsetX,
      valueLabelGap: 6
    })
  );
  body.push(
    uiStatBlock(col2X, heroStatY, prLabel, input.activity.totalPrs.toLocaleString("en-US"), tokens, {
      width: colW,
      valueSize: heroValueSize,
      align: "start",
      insetX: statInsetX,
      valueLabelGap: 6
    })
  );
  body.push(
    uiStatBlock(col3X, heroStatY, "ISSUES", input.activity.totalIssues.toLocaleString("en-US"), tokens, {
      width: colW,
      valueSize: heroValueSize,
      align: "start",
      insetX: statInsetX,
      valueLabelGap: 6
    })
  );
  const dividerY = heroStatY + (tiny ? 42 : compact ? 54 : 60);
  body.push(roundedRect(leftX, dividerY, contentW, 1, 0, { fill: tokens.border }));

  // Streak area
  const currentText = `CURRENT ${input.streak.current}`;
  const longestText = `LONGEST ${input.streak.longest}`;
  if (tiny) {
    const streakLineY = Math.min(dividerY + 12, langLabelY - 12);
    body.push(
      `<text x="${leftX}" y="${streakLineY}" class="mono cap" fill="${escapeXml(
        tokens.textMuted
      )}" font-size="10" font-weight="500" dominant-baseline="hanging">${escapeXml(`STREAK ${input.streak.current} / ${input.streak.longest}`)}</text>`
    );
  } else {
    const streakY = heroStatY + (compact ? 70 : 78) + sectionGap;
    const badgeWidth = (text: string) => Math.ceil(8 * 2 + text.length * 12 * 0.62);
    const badgeGap = space;
    const firstW = badgeWidth(currentText);
    const secondW = badgeWidth(longestText);
    const badgesW = firstW + badgeGap + secondW;
    const badgeStartX = leftX + Math.max(0, (contentW - badgesW) / 2);
    body.push(uiBadge(badgeStartX, streakY, currentText, tokens));
    body.push(uiBadge(badgeStartX + firstW + badgeGap, streakY, longestText, tokens));
  }

  // Attribute area (full-width language bar)
  const totalBytes = input.langs.totalBytes;
  const top = totalBytes > 0 ? input.langs.top : [];
  const barX = leftX;
  const barW = contentW;
  const langLabel = top
    .slice(0, 3)
    .map((l) => `${l.name} ${Math.round((l.bytes / Math.max(1, totalBytes)) * 100)}%`)
    .join(" · ");
  body.push(
    `<text x="${leftX}" y="${langLabelY}" class="mono" fill="${escapeXml(tokens.textSecondary)}" font-size="10" font-weight="400" dominant-baseline="hanging">${escapeXml(
      langLabel || "NO LANGUAGE DATA"
    )}</text>`
  );
  body.push(roundedRect(barX, barY, barW, barH, 0, { fill: tokens.borderStrong }));
  let cursor = barX;
  for (let i = 0; i < top.length; i++) {
    const l = top[i]!;
    const w = clamp((l.bytes / Math.max(1, totalBytes)) * barW, 0, barW);
    if (w <= 0) continue;
    const rawColor = (l as unknown as { color?: unknown }).color;
    const fill = isHexColor(rawColor) ? rawColor : tokens.text;
    const opacity = isHexColor(rawColor) ? 0.95 : Math.max(0.24, 0.88 - i * 0.14);
    body.push(`<rect x="${cursor}" y="${barY}" width="${w}" height="${barH}" fill="${escapeXml(fill)}" opacity="${opacity.toFixed(2)}" />`);
    cursor += w;
  }

  return svgDoc(
    {
      width,
      height,
      theme: input.theme,
      borderRadius: 4
    },
    body.join(""),
    { style }
  );
}

// Back-compat / local preview ergonomics
export function renderCard(input: Parameters<typeof renderUserCard>[0]): string {
  return renderUserCard(input);
}

export function renderFallbackCard(
  message: string,
  theme: SvgTheme,
  options: { width?: number; height?: number } = {}
): string {
  const width = options.width ?? 460;
  const height = options.height ?? 170;
  const body = [
    textEl("GitHub Stats", 18, 34, { fill: theme.title, fontSize: 16, fontWeight: 800 }),
    textEl("데이터를 불러오지 못했습니다.", 18, 62, { fill: theme.text, fontSize: 12, fontWeight: 600 }),
    textEl(message, 18, 84, { fill: theme.muted, fontSize: 11, fontWeight: 500, opacity: 0.9 })
  ].join("");
  return svgDoc({ width, height, theme }, body);
}

