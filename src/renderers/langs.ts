import type { LanguageStat } from "../fetchers/github/languages";
import type { SvgTheme } from "../utils/svg";
import { clamp, roundedRect, svgDoc, textEl } from "../utils/svg";

export function renderLangsCard(input: {
  username: string;
  totalBytes: number;
  top: LanguageStat[];
  theme: SvgTheme;
}): string {
  const width = 460;
  const height = 170;
  const { username, totalBytes, top, theme } = input;

  const title = `${username} · Top Languages`;
  const startX = 18;
  const startY = 58;
  const rowH = 20;

  const maxBytes = Math.max(...top.map((l) => l.bytes), 1);

  const body: string[] = [];
  body.push(
    textEl(title, 18, 28, { fill: theme.title, fontSize: 16, fontWeight: 800, dominantBaseline: "middle" })
  );
  body.push(
    textEl("최근 리포지토리 기반 추정치", 18, 50, {
      fill: theme.muted,
      fontSize: 12,
      fontWeight: 500,
      dominantBaseline: "middle"
    })
  );

  if (!top.length || totalBytes <= 0) {
    body.push(
      textEl("언어 데이터를 찾지 못했습니다.", 18, 92, { fill: theme.text, fontSize: 12, fontWeight: 600 })
    );
    return svgDoc({ width, height, theme }, body.join(""));
  }

  const barX = 210;
  const barW = 220;
  const barH = 10;

  top.forEach((l, i) => {
    const y = startY + i * rowH;
    const pct = (l.bytes / totalBytes) * 100;
    const ratio = clamp(l.bytes / maxBytes, 0, 1);
    const color = l.color ?? theme.accent;

    body.push(
      `<circle cx="${startX + 6}" cy="${y}" r="5" fill="${color}" />` +
        textEl(l.name, startX + 18, y, {
          fill: theme.text,
          fontSize: 12,
          fontWeight: 650,
          dominantBaseline: "middle"
        })
    );

    body.push(
      textEl(`${pct.toFixed(1)}%`, 190, y, {
        fill: theme.muted,
        fontSize: 12,
        fontWeight: 600,
        textAnchor: "end",
        dominantBaseline: "middle"
      })
    );

    body.push(roundedRect(barX, y - 6, barW, barH, 6, { fill: theme.border }));
    body.push(roundedRect(barX, y - 6, barW * ratio, barH, 6, { fill: color }));
  });

  return svgDoc({ width, height, theme }, body.join(""));
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

