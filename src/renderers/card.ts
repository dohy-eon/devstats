import type { GitHubUser } from "../fetchers/github/user";
import type { GitHubActivityStats } from "../fetchers/github/activity";
import type { LanguageStat } from "../fetchers/github/languages";
import type { SvgTheme } from "../utils/svg";
import { escapeXml, roundedRect, svgDoc, textEl, uiStyle, xaiTokens } from "../utils/svg";

function rotateAround(cx: number, cy: number, deg: number): string {
  return `translate(${cx} ${cy}) rotate(${deg}) translate(${-cx} ${-cy})`;
}

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
  // Layered paper-card aesthetic inspired by the provided reference photo.
  const width = input.width ?? 560;
  const tokens = xaiTokens();
  const pad = 24;

  const rows: Array<{ label: string; value: string }> = [
    { label: "commits", value: input.activity.totalCommitsLastYear.toLocaleString("en-US") },
    { label: "pull requests", value: input.activity.totalPrsLastYear.toLocaleString("en-US") },
    { label: "current streak", value: `${input.streak.current}` },
    { label: "longest streak", value: `${input.streak.longest}` }
  ];

  const body: string[] = [];

  const height = input.height ?? 300;
  const paperW = width - pad * 2;
  const paperH = Math.max(220, height - pad * 2);

  // Background (dark canvas)
  body.push(roundedRect(0, 0, width, height, 4, { fill: tokens.bg, stroke: tokens.border, strokeWidth: 1 }));

  // Paper styling
  const paperFill = "#eef0f3";
  const paperStroke = "rgba(0,0,0,0.10)";
  const paperText = "rgba(15, 23, 42, 0.92)";
  const paperMuted = "rgba(15, 23, 42, 0.70)";

  const px = pad;
  const py = pad;

  const paperBack1 = { x: px + 18, y: py + 8, w: paperW - 24, h: paperH - 56, r: 2, rot: -2.2 };
  const paperBack2 = { x: px + 6, y: py + 30, w: paperW - 8, h: paperH - 36, r: 2, rot: 1.4 };
  const paperFront = { x: px, y: py + 14, w: paperW, h: paperH, r: 2, rot: 0 };

  const defs = `
    <filter id="paperShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  `;

  const style = `
    ${uiStyle()}
    .paper { filter: url(#paperShadow); }
    .paperText { font-family: ${escapeXml("ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif")}; }
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
      backText(paperBack1.x, paperBack1.y, paperBack1.w, "excerpt · devstats", [faintLine3, faintLine1, faintLine2])
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
      backText(paperBack2.x, paperBack2.y, paperBack2.w, `note · @${input.user.login}`, [faintLine1, faintLine2, faintLine3])
    )
  );
  body.push(paperGroup(paperFront.x, paperFront.y, paperFront.w, paperFront.h, paperFront.r, paperFront.rot));

  // Content on the front paper (no rotation so it's readable)
  const innerX = paperFront.x + 22;
  const innerY = paperFront.y + 26;
  const innerW = paperFront.w - 44;

  body.push(
    `<text x="${innerX}" y="${innerY}" class="paperMono" fill="${escapeXml(paperMuted)}" font-size="12" font-weight="500">${escapeXml(
      `@${input.user.login} · ${input.year}`
    )}</text>`
  );

  // Dense paragraph-like blocks to mimic printed excerpts
  const lineY0 = innerY + 26;
  const lineGap = 16;
  const line1 = `${rows[0]!.label} ${rows[0]!.value} · ${rows[1]!.label} ${rows[1]!.value}`;
  const line2 = `${rows[2]!.label} ${rows[2]!.value} · ${rows[3]!.label} ${rows[3]!.value}`;
  body.push(
    `<text x="${innerX}" y="${lineY0}" class="paperText" fill="${escapeXml(paperText)}" font-size="14" font-weight="600">${escapeXml(
      line1
    )}</text>`
  );
  body.push(
    `<text x="${innerX}" y="${lineY0 + lineGap}" class="paperText" fill="${escapeXml(paperText)}" font-size="14" font-weight="600">${escapeXml(
      line2
    )}</text>`
  );

  // Language breakdown at the bottom of the paper
  const totalBytes = input.langs.totalBytes;
  const top = totalBytes > 0 ? input.langs.top : [];

  const barLabelY = paperFront.y + paperFront.h - 54;
  body.push(
    `<text x="${innerX}" y="${barLabelY}" class="paperMono" fill="${escapeXml(paperMuted)}" font-size="12" font-weight="500">${escapeXml(
      "language breakdown"
    )}</text>`
  );

  const barX = innerX;
  const barY = barLabelY + 12;
  const barW = innerW;
  const barH = 5;
  body.push(roundedRect(barX, barY, barW, barH, 2, { fill: "rgba(15, 23, 42, 0.10)" }));

  // monochrome-ish segments on paper
  let cursor = barX;
  for (let i = 0; i < top.length; i++) {
    const l = top[i]!;
    const pct = (l.bytes / totalBytes) * 100;
    const w = (pct / 100) * barW;
    if (w <= 0) continue;
    const opacity = Math.max(0.20, 0.85 - i * 0.16);
    body.push(`<rect x="${cursor}" y="${barY}" width="${w}" height="${barH}" fill="rgba(15, 23, 42, 0.85)" opacity="${opacity.toFixed(2)}" />`);
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

    const legendY = barY + barH + 16;
    body.push(
      `<text x="${innerX}" y="${legendY}" class="paperMono" fill="${escapeXml(paperMuted)}" font-size="11" font-weight="500">${escapeXml(
        legend
      )}</text>`
    );
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

