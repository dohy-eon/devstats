import type { LanguageStat } from "../fetchers/github/languages";
import type { SvgTheme } from "../utils/svg";
import { clamp, escapeXml, roundedRect, svgDoc, textEl, uiStyle, xaiTokens } from "../utils/svg";

export function renderLangsCard(input: {
  username: string;
  totalBytes: number;
  top: LanguageStat[];
  theme: SvgTheme;
}): string {
  const width = 460;
  const height = 190;
  const { username, totalBytes, top, theme } = input;
  const tokens = xaiTokens();
  const pad = 24;
  const contentW = width - pad * 2;
  const barX = pad;
  const barW = contentW;
  const rowH = 24;

  const maxBytes = Math.max(...top.map((l) => l.bytes), 1, 1);

  const body: string[] = [];
  body.push(roundedRect(0, 0, width, height, 4, { fill: tokens.bg, stroke: tokens.border, strokeWidth: 1 }));
  body.push(
    `<text x="${pad}" y="${pad}" class="mono" fill="${tokens.text}" font-size="18" font-weight="700" dominant-baseline="hanging">${escapeXml(
      username
    )}</text>`
  );
  body.push(`<text x="${width - pad}" y="${pad}" class="mono cap" fill="${tokens.textMuted}" font-size="11" font-weight="500" text-anchor="end" dominant-baseline="hanging">LANGUAGES</text>`);
  body.push(
    `<text x="${pad}" y="${pad + 22}" class="mono cap" fill="${tokens.textMuted}" font-size="10" font-weight="500" dominant-baseline="hanging">RECENT REPOSITORY ESTIMATE</text>`
  );

  if (!top.length || totalBytes <= 0) {
    body.push(textEl("언어 데이터를 찾지 못했습니다.", pad, 100, { fill: tokens.text, fontSize: 12, fontWeight: 600 }));
    return svgDoc(
      {
        width,
        height,
        theme: { ...theme, bg: tokens.bg, border: tokens.border, title: tokens.text, text: tokens.text, muted: tokens.textMuted, accent: "#ffffff" },
        borderRadius: 4
      },
      body.join(""),
      { style: uiStyle() }
    );
  }

  const top3 = top.slice(0, 3);
  const startY = pad + 56;
  const barH = 6;

  top3.forEach((l, i) => {
    const y = startY + i * rowH;
    const pct = (l.bytes / totalBytes) * 100;
    const ratio = clamp(l.bytes / maxBytes, 0, 1);
    const color = l.color ?? tokens.text;

    body.push(
      `<text x="${pad}" y="${y}" class="mono cap" fill="${tokens.textMuted}" font-size="10" font-weight="500" dominant-baseline="middle">${escapeXml(
        l.name
      )}</text>`
    );
    body.push(textEl(`${pct.toFixed(1)}%`, width - pad, y, { fill: tokens.text, fontSize: 12, fontWeight: 700, textAnchor: "end", dominantBaseline: "middle" }));
    body.push(roundedRect(barX, y + 8, barW, barH, 0, { fill: tokens.border }));
    body.push(roundedRect(barX, y + 8, barW * ratio, barH, 0, { fill: color }));
  });

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

export function renderFallbackLangs(message: string, theme: SvgTheme): string {
  const width = 460;
  const height = 170;
  const body = [
    textEl("Top Languages", 18, 34, { fill: theme.title, fontSize: 16, fontWeight: 800 }),
    textEl("데이터를 불러오지 못했습니다.", 18, 62, { fill: theme.text, fontSize: 12, fontWeight: 600 }),
    textEl(message, 18, 84, { fill: theme.muted, fontSize: 11, fontWeight: 500, opacity: 0.9 })
  ].join("");
  return svgDoc({ width, height, theme }, body);
}

