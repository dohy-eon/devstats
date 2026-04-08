import type { GitHubUser } from "../fetchers/github/user";
import type { GitHubActivityStats } from "../fetchers/github/activity";
import type { LanguageStat } from "../fetchers/github/languages";
import type { SvgTheme } from "../utils/svg";
import { escapeXml, roundedRect, svgDoc, textEl, uiStyle, xaiTokens } from "../utils/svg";

export function renderUserCard(input: {
  user: GitHubUser;
  activity: GitHubActivityStats;
  langs: { totalBytes: number; top: LanguageStat[] };
  streak: { current: number; longest: number };
  year: number;
  theme: SvgTheme;
  width?: number;
  height?: number;
}): string {
  // Typography-forward minimal stats card (DESIGN.md).
  const width = input.width ?? 520;
  const tokens = xaiTokens();
  const padX = 24;
  const padY = 22;
  const rowGap = 14;
  const labelSize = 12;
  const valueSize = 14;

  const rows: Array<{ label: string; value: string }> = [
    { label: "commits", value: input.activity.totalCommitsLastYear.toLocaleString("en-US") },
    { label: "pull requests", value: input.activity.totalPrsLastYear.toLocaleString("en-US") },
    { label: "repositories", value: input.user.publicRepos.toLocaleString("en-US") },
    { label: "current streak", value: `${input.streak.current}` },
    { label: "longest streak", value: `${input.streak.longest}` }
  ];

  const body: string[] = [];

  const contentHeight = (() => {
    const startY = padY + 26;
    const barLabelY = startY + rows.length * rowGap + 10;
    const barY = barLabelY + 10;
    const barH = 4;
    return Math.ceil(barY + barH + padY + 8);
  })();
  const height = Math.max(input.height ?? 0, contentHeight, 180);

  // Card container: subtle surface + thin border, minimal radius (0-4px).
  body.push(roundedRect(0, 0, width, height, 4, { fill: tokens.bg, stroke: tokens.border, strokeWidth: 1 }));
  body.push(roundedRect(10, 10, width - 20, height - 20, 0, { fill: tokens.surface, stroke: tokens.border, strokeWidth: 1 }));

  // Small meta line (top)
  body.push(
    `<text x="${padX}" y="${padY}" class="mono cap" fill="${escapeXml(tokens.textFaint)}" font-size="12" font-weight="400">${escapeXml(
      `@${input.user.login} · ${input.year}`
    )}</text>`
  );

  // Rows: label left, value right
  const startY = padY + 26;
  const valueX = width - padX;
  rows.forEach((r, i) => {
    const y = startY + i * rowGap;
    body.push(
      `<text x="${padX}" y="${y}" class="sans" fill="${escapeXml(tokens.textMuted)}" font-size="${labelSize}" font-weight="400">${escapeXml(
        r.label
      )}</text>`
    );
    body.push(
      `<text x="${valueX}" y="${y}" class="mono" fill="${escapeXml(tokens.textSecondary)}" font-size="${valueSize}" font-weight="400" text-anchor="end">${escapeXml(
        r.value
      )}</text>`
    );
  });

  // Language breakdown (thin bar)
  const barLabelY = startY + rows.length * rowGap + 10;
  body.push(
    `<text x="${padX}" y="${barLabelY}" class="sans" fill="${escapeXml(tokens.textMuted)}" font-size="${labelSize}" font-weight="400">${escapeXml(
      "language breakdown"
    )}</text>`
  );

  const barX = padX;
  const barY = barLabelY + 10;
  const barW = width - padX * 2;
  const barH = 4;
  body.push(roundedRect(barX, barY, barW, barH, 0, { fill: "rgba(255,255,255,0.08)" }));

  const totalBytes = input.langs.totalBytes;
  const top = totalBytes > 0 ? input.langs.top : [];

  // monochrome segments with descending opacity
  let cursor = barX;
  for (let i = 0; i < top.length; i++) {
    const l = top[i]!;
    const pct = (l.bytes / totalBytes) * 100;
    const w = (pct / 100) * barW;
    if (w <= 0) continue;
    const opacity = Math.max(0.25, 0.95 - i * 0.15);
    body.push(`<rect x="${cursor}" y="${barY}" width="${w}" height="${barH}" fill="#ffffff" opacity="${opacity.toFixed(2)}" />`);
    cursor += w;
  }

  return svgDoc(
    {
      width,
      height,
      theme: { ...input.theme, bg: tokens.bg, border: tokens.border, title: tokens.text, text: tokens.text, muted: tokens.textMuted, accent: "#ffffff" },
      borderRadius: 4
    },
    body.join(""),
    { style: uiStyle() }
  );
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

