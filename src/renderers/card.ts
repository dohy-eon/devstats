import type { GitHubUser } from "../fetchers/github/user";
import type { GitHubActivityStats } from "../fetchers/github/activity";
import type { LanguageStat } from "../fetchers/github/languages";
import type { SvgTheme } from "../utils/svg";
import { escapeXml, roundedRect, svgDoc, textEl } from "../utils/svg";

export function renderUserCard(input: {
  user: GitHubUser;
  activity: GitHubActivityStats;
  langs: { totalBytes: number; top: LanguageStat[] };
  streak: { current: number; longest: number };
  year: number;
  theme: SvgTheme;
}): string {
  // Dashboard-style layout inspired by the provided reference image.
  const width = 960;
  const height = 560;

  // Palette tuned to the reference look (subtle border, dark surface).
  const { theme } = input;
  const bg = theme.bg;
  const surface = "#111111";
  const surface2 = "#0e0e0e";
  const stroke = "rgba(255,255,255,0.10)";
  const stroke2 = "rgba(255,255,255,0.06)";
  const muted = "rgba(255,255,255,0.55)";
  const faint = "rgba(255,255,255,0.30)";
  const title = "rgba(255,255,255,0.92)";
  const mono = `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
  const sans = `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"`;

  const style = `
    .mono { font-family: ${mono}; }
    .sans { font-family: ${sans}; }
    .cap { letter-spacing: 0.22em; text-transform: uppercase; }
  `;

  const cardR = 22;
  const boxR = 12;
  const pad = 28;
  const topY = 22;

  const headerLeft = `${"openspec".toUpperCase()} · ${"github stats".toUpperCase()}`;
  const userHandle = `@${input.user.login}`;

  const body: string[] = [];

  // Outer background
  body.push(
    `<rect x="0" y="0" width="${width}" height="${height}" rx="${cardR}" ry="${cardR}" fill="${escapeXml(
      bg
    )}" />`
  );
  // Inner subtle vignette
  body.push(
    `<rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="${cardR - 8}" ry="${cardR - 8}" fill="${surface2}" opacity="0.95" />`
  );
  body.push(
    `<rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="${cardR - 8}" ry="${cardR - 8}" fill="none" stroke="${stroke2}" />`
  );

  // Header texts
  body.push(
    `<text x="${pad}" y="${topY + 22}" class="mono cap" fill="${faint}" font-size="11" font-weight="600">${escapeXml(
      headerLeft
    )}</text>`
  );
  body.push(
    `<text x="${pad}" y="${topY + 64}" class="mono" fill="${title}" font-size="40" font-weight="800">${escapeXml(
      userHandle
    )}</text>`
  );

  // Year badge (top-right)
  const badgeW = 150;
  const badgeH = 34;
  const badgeX = width - pad - badgeW;
  const badgeY = topY + 18;
  body.push(
    roundedRect(badgeX, badgeY, badgeW, badgeH, 9, { fill: "rgba(255,255,255,0.05)", stroke: stroke, strokeWidth: 1 })
  );
  body.push(
    `<text x="${badgeX + badgeW / 2}" y="${badgeY + 22}" class="mono cap" fill="${muted}" font-size="11" font-weight="700" text-anchor="middle">${escapeXml(
      `${input.year} · active`
    )}</text>`
  );

  // Divider
  const divY = topY + 92;
  body.push(`<line x1="${pad}" y1="${divY}" x2="${width - pad}" y2="${divY}" stroke="${stroke2}" />`);

  // Stats row (3 boxes)
  const row1Y = divY + 32;
  const gap = 18;
  const boxW = Math.floor((width - pad * 2 - gap * 2) / 3);
  const boxH = 108;

  const statBoxes = [
    {
      label: "TOTAL COMMITS",
      value: input.activity.totalCommitsLastYear,
      sub: "↑ vs last year"
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
    body.push(roundedRect(x, row1Y, boxW, boxH, boxR, { fill: surface, stroke: stroke, strokeWidth: 1 }));
    body.push(
      `<text x="${x + 18}" y="${row1Y + 30}" class="mono cap" fill="${faint}" font-size="11" font-weight="700">${escapeXml(
        statBoxes[i]!.label
      )}</text>`
    );
    body.push(
      `<text x="${x + 18}" y="${row1Y + 70}" class="mono" fill="${title}" font-size="34" font-weight="850">${escapeXml(
        statBoxes[i]!.value.toLocaleString("en-US")
      )}</text>`
    );
    body.push(
      `<text x="${x + 18}" y="${row1Y + 94}" class="mono" fill="${muted}" font-size="11" font-weight="650">${escapeXml(
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
    body.push(roundedRect(x, row2Y, wideW, wideH, boxR, { fill: surface, stroke: stroke, strokeWidth: 1 }));
    body.push(
      `<text x="${x + wideW / 2}" y="${row2Y + 56}" class="mono" fill="${title}" font-size="42" font-weight="900" text-anchor="middle">${escapeXml(
        String(streakBoxes[i]!.value)
      )}</text>`
    );
    body.push(
      `<text x="${x + wideW / 2}" y="${row2Y + 84}" class="mono cap" fill="${faint}" font-size="11" font-weight="750" text-anchor="middle">${escapeXml(
        streakBoxes[i]!.label
      )}</text>`
    );
    // thin progress line (purely decorative, matches reference vibe)
    body.push(
      `<line x1="${x + 22}" y1="${row2Y + 96}" x2="${x + wideW - 22}" y2="${row2Y + 96}" stroke="${stroke2}" stroke-linecap="round" />`
    );
  }

  // Contribution activity section removed (per request)

  // Language breakdown
  const langY = row2Y + wideH + 34;
  body.push(
    `<text x="${pad}" y="${langY}" class="mono cap" fill="${faint}" font-size="11" font-weight="750">${escapeXml(
      "LANGUAGE BREAKDOWN"
    )}</text>`
  );

  const barX = pad;
  const barY = langY + 26;
  const barW = width - pad * 2;
  const barH2 = 10;
  body.push(roundedRect(barX, barY, barW, barH2, 999, { fill: "rgba(255,255,255,0.08)" }));

  const top = input.langs.top;
  const totalBytes = input.langs.totalBytes;
  const normalized = totalBytes > 0 ? top : [];

  // Build segments with "Other"
  const segments: { name: string; pct: number; color: string }[] = [];
  let accPct = 0;
  for (const l of normalized) {
    const pct = totalBytes > 0 ? (l.bytes / totalBytes) * 100 : 0;
    accPct += pct;
    segments.push({ name: l.name, pct, color: l.color ?? "rgba(255,255,255,0.7)" });
  }
  const otherPct = Math.max(0, 100 - accPct);
  if (otherPct > 0.5) segments.push({ name: "Other", pct: otherPct, color: "rgba(255,255,255,0.30)" });

  // Draw segments
  let cursor = barX;
  for (const seg of segments) {
    const w = (seg.pct / 100) * barW;
    if (w <= 0) continue;
    body.push(`<rect x="${cursor}" y="${barY}" width="${w}" height="${barH2}" fill="${escapeXml(seg.color)}" opacity="0.95" />`);
    cursor += w;
  }

  // Legend (up to 5 items)
  const legendY = barY + 34;
  const legendItems = segments.slice(0, 5);
  let lx = pad;
  for (const seg of legendItems) {
    const label = `${seg.name} ${seg.pct.toFixed(0)}%`;
    body.push(`<circle cx="${lx + 6}" cy="${legendY - 4}" r="5" fill="${escapeXml(seg.color)}" opacity="0.95" />`);
    body.push(
      `<text x="${lx + 18}" y="${legendY}" class="mono" fill="${muted}" font-size="12" font-weight="650">${escapeXml(
        label
      )}</text>`
    );
    lx += 150;
  }

  // Footer divider + texts
  const footY = height - 64;
  body.push(`<line x1="${pad}" y1="${footY}" x2="${width - pad}" y2="${footY}" stroke="${stroke2}" />`);
  body.push(
    `<text x="${pad}" y="${height - 34}" class="mono cap" fill="${faint}" font-size="10" font-weight="700">${escapeXml(
      "GENERATED BY DEVSTATS"
    )}</text>`
  );
  body.push(
    `<text x="${width - pad}" y="${height - 34}" class="mono cap" fill="${faint}" font-size="10" font-weight="700" text-anchor="end">${escapeXml(
      "UPDATED VIA GITHUB API"
    )}</text>`
  );

  return svgDoc(
    { width, height, theme: { ...input.theme, bg }, borderRadius: cardR },
    body.join(""),
    { style }
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

