import type { GitHubUser } from "../fetchers/github/user";
import type { GitHubActivityStats } from "../fetchers/github/activity";
import type { LanguageStat } from "../fetchers/github/languages";
import type { SvgTheme } from "../utils/svg";
import { escapeXml, svgDoc, textEl, uiBadge, uiCard, uiDivider, uiStyle, xaiTokens } from "../utils/svg";

export function renderUserCard(input: {
  user: GitHubUser;
  activity: GitHubActivityStats;
  langs: { totalBytes: number; top: LanguageStat[] };
  streak: { current: number; longest: number };
  year: number;
  theme: SvgTheme;
}): string {
  // xAI-inspired minimal brutalist dashboard (DESIGN.md).
  const width = 960;
  const height = 560;
  const tokens = xaiTokens();
  const pad = 32;
  const topY = 32;
  const body: string[] = [];

  // Header texts
  body.push(
    `<text x="${pad}" y="${topY}" class="mono cap" fill="${escapeXml(tokens.textFaint)}" font-size="14" font-weight="400">${escapeXml(
      "GITHUB STATS"
    )}</text>`
  );
  body.push(
    `<text x="${pad}" y="${topY + 54}" class="mono" fill="${escapeXml(tokens.text)}" font-size="52" font-weight="300">${escapeXml(
      `@${input.user.login}`
    )}</text>`
  );

  // Year badge (top-right)
  body.push(uiBadge(width - pad - 160, topY - 18, `${input.year} · ACTIVE`, tokens, { radius: 0 }));

  // Divider
  const divY = topY + 78;
  body.push(uiDivider(pad, divY, width - pad, tokens.border));

  // Stats row (3 boxes)
  const row1Y = divY + 32;
  const gap = 18;
  const boxW = Math.floor((width - pad * 2 - gap * 2) / 3);
  const boxH = 108;

  const statBoxes = [
    {
      label: "TOTAL COMMITS",
      value: input.activity.totalCommitsLastYear,
      sub: "vs last year"
    },
    {
      label: "PULL REQUESTS",
      value: input.activity.totalPrsLastYear,
      sub: `merged: ${input.activity.mergedPrsAllTime.toLocaleString("en-US")}`
    },
    {
      label: "REPOSITORIES",
      value: input.user.publicRepos,
      sub: `public: ${input.user.publicRepos.toLocaleString("en-US")}`
    }
  ];

  for (let i = 0; i < 3; i++) {
    const x = pad + i * (boxW + gap);
    body.push(uiCard(x, row1Y, boxW, boxH, tokens, { radius: 0 }));
    body.push(
      `<text x="${x + 18}" y="${row1Y + 32}" class="mono cap" fill="${escapeXml(tokens.textFaint)}" font-size="12" font-weight="400">${escapeXml(
        statBoxes[i]!.label
      )}</text>`
    );
    body.push(
      `<text x="${x + 18}" y="${row1Y + 74}" class="mono" fill="${escapeXml(tokens.text)}" font-size="40" font-weight="300">${escapeXml(
        statBoxes[i]!.value.toLocaleString("en-US")
      )}</text>`
    );
    body.push(
      `<text x="${x + 18}" y="${row1Y + 98}" class="sans" fill="${escapeXml(tokens.textMuted)}" font-size="12" font-weight="400">${escapeXml(
        statBoxes[i]!.sub
      )}</text>`
    );
  }

  // Streak row (2 wide boxes)
  const row2Y = row1Y + boxH + 22;
  const wideW = Math.floor((width - pad * 2 - gap) / 2);
  const wideH = 112;

  const streakBoxes = [
    { label: "CURRENT STREAK · DAYS", value: input.streak.current },
    { label: "LONGEST STREAK · DAYS", value: input.streak.longest }
  ];

  for (let i = 0; i < 2; i++) {
    const x = pad + i * (wideW + gap);
    body.push(uiCard(x, row2Y, wideW, wideH, tokens, { radius: 0 }));
    body.push(
      `<text x="${x + wideW / 2}" y="${row2Y + 58}" class="mono" fill="${escapeXml(tokens.text)}" font-size="56" font-weight="300" text-anchor="middle">${escapeXml(
        String(streakBoxes[i]!.value)
      )}</text>`
    );
    body.push(
      `<text x="${x + wideW / 2}" y="${row2Y + 90}" class="mono cap" fill="${escapeXml(tokens.textFaint)}" font-size="12" font-weight="400" text-anchor="middle">${escapeXml(
        streakBoxes[i]!.label
      )}</text>`
    );
    body.push(uiDivider(x + 18, row2Y + 100, x + wideW - 18, tokens.border));
  }

  // Contribution activity section removed (per request)

  // Language breakdown
  const langY = row2Y + wideH + 34;
  body.push(
    `<text x="${pad}" y="${langY}" class="mono cap" fill="${escapeXml(tokens.textFaint)}" font-size="14" font-weight="400">${escapeXml(
      "LANGUAGE BREAKDOWN"
    )}</text>`
  );

  const barX = pad;
  const barY = langY + 26;
  const barW = width - pad * 2;
  const barH2 = 10;
  body.push(uiCard(barX, barY, barW, barH2, { ...tokens, surface: "rgba(255,255,255,0.08)" }, { radius: 0 }));

  const top = input.langs.top;
  const totalBytes = input.langs.totalBytes;
  const normalized = totalBytes > 0 ? top : [];

  // Build segments with "Other"
  const segments: { name: string; pct: number; opacity: number }[] = [];
  let accPct = 0;
  let idx = 0;
  for (const l of normalized) {
    const pct = totalBytes > 0 ? (l.bytes / totalBytes) * 100 : 0;
    accPct += pct;
    // DESIGN.md: monochrome palette (no colored accents). Use white with descending opacity.
    const opacity = Math.max(0.25, 0.95 - idx * 0.15);
    segments.push({ name: l.name, pct, opacity });
    idx += 1;
  }
  const otherPct = Math.max(0, 100 - accPct);
  if (otherPct > 0.5) segments.push({ name: "Other", pct: otherPct, opacity: 0.25 });

  // Draw segments
  let cursor = barX;
  for (const seg of segments) {
    const w = (seg.pct / 100) * barW;
    if (w <= 0) continue;
    body.push(
      `<rect x="${cursor}" y="${barY}" width="${w}" height="${barH2}" fill="#ffffff" opacity="${seg.opacity.toFixed(2)}" />`
    );
    cursor += w;
  }

  // Legend (up to 5 items)
  const legendY = barY + 34;
  const legendItems = segments.slice(0, 5);
  let lx = pad;
  for (const seg of legendItems) {
    const label = `${seg.name} ${seg.pct.toFixed(0)}%`;
    body.push(`<rect x="${lx}" y="${legendY - 12}" width="10" height="10" fill="#ffffff" opacity="${seg.opacity.toFixed(2)}" />`);
    body.push(
      `<text x="${lx + 18}" y="${legendY - 2}" class="sans" fill="${escapeXml(tokens.textSecondary)}" font-size="14" font-weight="400">${escapeXml(
        label
      )}</text>`
    );
    lx += 170;
  }

  // Footer divider + texts
  const footY = height - 64;
  body.push(uiDivider(pad, footY, width - pad, tokens.border));
  body.push(
    `<text x="${pad}" y="${height - 34}" class="mono cap" fill="${escapeXml(tokens.textFaint)}" font-size="12" font-weight="400">${escapeXml(
      "GENERATED BY DEVSTATS"
    )}</text>`
  );
  body.push(
    `<text x="${width - pad}" y="${height - 34}" class="mono cap" fill="${escapeXml(tokens.textFaint)}" font-size="12" font-weight="400" text-anchor="end">${escapeXml(
      "UPDATED VIA GITHUB API"
    )}</text>`
  );

  return svgDoc(
    { width, height, theme: { ...input.theme, bg: tokens.bg, border: tokens.border, title: tokens.text, text: tokens.text, muted: tokens.textMuted, accent: "#ffffff" }, borderRadius: 4 },
    body.join(""),
    { style: uiStyle() }
  );
}

export function renderFallbackCard(message: string, theme: SvgTheme): string {
  const width = 460;
  const height = 170;
  const body = [
    textEl("GitHub Stats", 18, 34, { fill: theme.title, fontSize: 16, fontWeight: 800 }),
    textEl("데이터를 불러오지 못했습니다.", 18, 62, { fill: theme.text, fontSize: 12, fontWeight: 600 }),
    textEl(message, 18, 84, { fill: theme.muted, fontSize: 11, fontWeight: 500, opacity: 0.9 })
  ].join("");
  return svgDoc({ width, height, theme }, body);
}

