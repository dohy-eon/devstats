import type { GitHubUser } from "../fetchers/github/user";
import type { GitHubActivityStats } from "../fetchers/github/activity";
import type { LanguageStat } from "../fetchers/github/languages";
import type { SpotifyNowPlaying } from "../fetchers/spotify/types";
import type { SvgTheme } from "../utils/svg";
import { escapeXml, roundedRect, svgDoc, textEl, uiStyle, xaiTokens } from "../utils/svg";

function rotateAround(cx: number, cy: number, deg: number): string {
  return `translate(${cx} ${cy}) rotate(${deg}) translate(${-cx} ${-cy})`;
}

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
  // Layered paper-card aesthetic inspired by the provided reference photo.
  const width = input.width ?? 560;
  const tokens = xaiTokens();
  const height = input.height ?? 300;
  const compact = height <= 200;
  const pad = compact ? 12 : 24;

  const rows: Array<{ label: string; value: string }> = [
    { label: "commits", value: input.activity.totalCommits.toLocaleString("en-US") },
    { label: "pull requests", value: input.activity.totalPrs.toLocaleString("en-US") },
    { label: "current streak", value: `${input.streak.current}` },
    { label: "longest streak", value: `${input.streak.longest}` }
  ];

  const body: string[] = [];

  const paperW = width - pad * 2;
  const basePaperH = Math.max(0, height - pad * 2);
  const paperH = compact ? basePaperH : Math.max(220, basePaperH);

  // Background (dark canvas)
  body.push(roundedRect(0, 0, width, height, 4, { fill: tokens.bg, stroke: tokens.border, strokeWidth: 1 }));

  // Paper styling
  const paperFill = "#eef0f3";
  const paperStroke = "rgba(0,0,0,0.10)";
  const paperText = "rgba(15, 23, 42, 0.92)";
  const paperMuted = "rgba(15, 23, 42, 0.70)";

  const px = pad;
  const py = pad;

  const paperFront = { x: px, y: py + (compact ? 8 : 14), w: paperW, h: paperH, r: 2, rot: 0 };
  const paperBack1 = {
    x: paperFront.x + (compact ? 10 : 18),
    y: paperFront.y - (compact ? 10 : 6),
    w: paperFront.w - (compact ? 18 : 24),
    h: Math.max(60, paperFront.h - (compact ? 18 : 56)),
    r: 2,
    rot: compact ? -1.4 : -2.2
  };
  const paperBack2 = {
    x: paperFront.x + (compact ? 4 : 6),
    y: paperFront.y + (compact ? 10 : 16),
    w: paperFront.w - (compact ? 8 : 8),
    h: Math.max(70, paperFront.h - (compact ? 10 : 36)),
    r: 2,
    rot: compact ? 0.9 : 1.4
  };

  const defs = `
    <filter id="paperShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  `;

  const style = `
    ${uiStyle()}
    .paper { filter: url(#paperShadow); }
    .paperText { font-family: ${escapeXml('Inter, "SF Pro Display", "Avenir Next", "Helvetica Neue", "Pretendard Variable", Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif')}; }
    .paperMono { font-family: ${escapeXml("ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace")}; }
  `;

  const paperGroup = (x: number, y: number, w: number, h: number, r: number, rot: number, inner: string = ""): string => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const t = rotateAround(cx, cy, rot);
    return `<g class="paper" transform="${t}">${roundedRect(x, y, w, h, r, { fill: paperFill, stroke: paperStroke, strokeWidth: 1 })}${inner}</g>`;
  };

  const backText = (x: number, y: number, w: number, title: string, lines: string[]): string => {
    const tx = x + 18;
    const ty = y + 26;
    const maxChars = Math.max(24, Math.floor((w - 36) / 7.2));
    const cut = (s: string) => (s.length > maxChars ? `${s.slice(0, Math.max(0, maxChars - 1))}…` : s);
    return [
      `<text x="${tx}" y="${ty}" class="paperMono" fill="rgba(15, 23, 42, 0.45)" font-size="11" font-weight="500">${escapeXml(
        title
      )}</text>`,
      ...lines.map((l, i) => {
        const yy = ty + 18 + i * 14;
        return `<text x="${tx}" y="${yy}" class="paperText" fill="rgba(15, 23, 42, 0.38)" font-size="12" font-weight="600">${escapeXml(
          cut(l)
        )}</text>`;
      })
    ].join("");
  };

  const faintLine1 = `commits ${rows[0]!.value} · pull requests ${rows[1]!.value}`;
  const faintLine2 = `current streak ${rows[2]!.value} · longest streak ${rows[3]!.value}`;
  const faintLine3 =
    input.langs.totalBytes > 0
      ? `top languages: ${input.langs.top
          .slice(0, 3)
          .map((l) => l.name)
          .join(", ")}`
      : "top languages: n/a";

  body.push(
    paperGroup(
      paperBack1.x,
      paperBack1.y,
      paperBack1.w,
      paperBack1.h,
      paperBack1.r,
      paperBack1.rot,
      compact ? "" : backText(paperBack1.x, paperBack1.y, paperBack1.w, "excerpt · devstats", [faintLine3, faintLine1, faintLine2])
    )
  );
  body.push(
    paperGroup(
      paperBack2.x,
      paperBack2.y,
      paperBack2.w,
      paperBack2.h,
      paperBack2.r,
      paperBack2.rot,
      compact ? "" : backText(paperBack2.x, paperBack2.y, paperBack2.w, `note · @${input.user.login}`, [faintLine1, faintLine2, faintLine3])
    )
  );
  body.push(paperGroup(paperFront.x, paperFront.y, paperFront.w, paperFront.h, paperFront.r, paperFront.rot));

  // Content on the front paper (no rotation so it's readable)
  const innerX = paperFront.x + (compact ? 16 : 22);
  const innerY = paperFront.y + (compact ? 20 : 26);
  const innerW = paperFront.w - (compact ? 32 : 44);

  body.push(
    `<text x="${innerX}" y="${innerY}" class="paperMono" fill="${escapeXml(paperMuted)}" font-size="12" font-weight="500">${escapeXml(
      `@${input.user.login} · ${input.year}`
    )}</text>`
  );

  const maxChars = Math.max(18, Math.floor(innerW / 7.0));
  const clampText = (s: string) => (s.length > maxChars ? `${s.slice(0, Math.max(0, maxChars - 1))}…` : s);

  // Profile music right under the GitHub id line
  const musicBlockTopY = innerY + (compact ? 16 : 18);
  const musicBlockH = input.nowPlaying ? (compact ? 26 : 30) : 0;
  if (input.nowPlaying) {
    const np = input.nowPlaying;
    const textX = innerX;
    body.push(
      `<text x="${textX}" y="${musicBlockTopY}" class="paperText" fill="${escapeXml(paperText)}" font-size="14" font-weight="650">${escapeXml(
        clampText(np.track)
      )}</text>`
    );
    body.push(
      `<text x="${textX}" y="${musicBlockTopY + (compact ? 14 : 16)}" class="paperText" fill="${escapeXml(
        paperMuted
      )}" font-size="${compact ? 11 : 12}" font-weight="600">${escapeXml(clampText(np.artists))}</text>`
    );
  }

  // Dense paragraph-like blocks to mimic printed excerpts
  const lineY0 = innerY + 24 + musicBlockH + (compact ? 8 : 10);
  const lineGap = compact ? 14 : 16;
  const statsFontSize = compact ? 12 : 13;
  const line1 = `${rows[0]!.label} ${rows[0]!.value} · ${rows[1]!.label} ${rows[1]!.value}`;
  const line2 = `${rows[2]!.label} ${rows[2]!.value} · ${rows[3]!.label} ${rows[3]!.value}`;
  body.push(
    `<text x="${innerX}" y="${lineY0}" class="paperText" fill="${escapeXml(paperText)}" font-size="${statsFontSize}" font-weight="600">${escapeXml(
      line1
    )}</text>`
  );
  body.push(
    `<text x="${innerX}" y="${lineY0 + lineGap}" class="paperText" fill="${escapeXml(paperText)}" font-size="${statsFontSize}" font-weight="600">${escapeXml(
      line2
    )}</text>`
  );

  // Language breakdown at the bottom of the paper
  const totalBytes = input.langs.totalBytes;
  const top = totalBytes > 0 ? input.langs.top : [];

  // Flow layout: place right after stats (remove the big blank gap).
  const barLabelY = lineY0 + lineGap + (compact ? 18 : 22);
  const barX = innerX;
  const barY = barLabelY;
  const barW = innerW;
  const barH = compact ? 4 : 5;
  body.push(roundedRect(barX, barY, barW, barH, 2, { fill: "rgba(15, 23, 42, 0.10)" }));

  // monochrome-ish segments on paper
  let cursor = barX;
  for (let i = 0; i < top.length; i++) {
    const l = top[i]!;
    const pct = (l.bytes / totalBytes) * 100;
    const w = (pct / 100) * barW;
    if (w <= 0) continue;
    const rawColor = (l as unknown as { color?: unknown }).color;
    const fill = isHexColor(rawColor) ? rawColor : "rgba(15, 23, 42, 0.85)";
    const opacity = isHexColor(rawColor) ? 0.92 : Math.max(0.20, 0.85 - i * 0.16);
    body.push(
      `<rect x="${cursor}" y="${barY}" width="${w}" height="${barH}" fill="${escapeXml(fill)}" opacity="${opacity.toFixed(2)}" />`
    );
    cursor += w;
  }

  // Percent legend under the bar (e.g. "TypeScript 52% · Go 24% · ...")
  if (top.length > 0 && totalBytes > 0) {
    const legend = top
      .slice(0, 4)
      .map((l) => {
        const pct = (l.bytes / totalBytes) * 100;
        const label = l.name;
        const pctStr = pct >= 10 ? `${Math.round(pct)}%` : `${pct.toFixed(1)}%`;
        return `${label} ${pctStr}`;
      })
      .join(" · ");

    const legendY = barY + barH + (compact ? 10 : 16);
    const paperBottom = paperFront.y + paperFront.h - (compact ? 6 : 14);
    if (legendY <= paperBottom) {
      body.push(
        `<text x="${innerX}" y="${legendY}" class="paperMono" fill="${escapeXml(paperMuted)}" font-size="${
          compact ? 9 : 11
        }" font-weight="500">${escapeXml(legend)}</text>`
      );
    }
  }

  return svgDoc(
    {
      width,
      height,
      theme: { ...input.theme, bg: tokens.bg, border: tokens.border, title: tokens.text, text: tokens.text, muted: tokens.textMuted, accent: "#ffffff" },
      borderRadius: 4
    },
    body.join(""),
    { defs, style }
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

