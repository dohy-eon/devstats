export type SvgTheme = {
  bg: string;
  border: string;
  title: string;
  text: string;
  muted: string;
  accent: string;
  shadow?: string;
  surface?: string;
  surfaceBorder?: string;
  surfaceMuted?: string;
};

export type SvgCardOptions = {
  width: number;
  height: number;
  title?: string;
  subtitle?: string;
  theme: SvgTheme;
  borderRadius?: number;
};

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function normalizeHexColor(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const raw = input.trim().replace(/^#/, "");
  if (!raw) return undefined;
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    const r = raw[0]!;
    const g = raw[1]!;
    const b = raw[2]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw}`.toLowerCase();
  }
  return undefined;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export type UiTextTone = "primary" | "secondary" | "muted" | "faint";

export type UiTokens = {
  bg: string; // page/canvas
  surface: string; // card surface
  surfaceHover?: string;
  border: string; // default border
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
};

export function xaiTokens(): UiTokens {
  return {
    bg: "#1f2228",
    surface: "rgba(255, 255, 255, 0.03)",
    surfaceHover: "rgba(255, 255, 255, 0.08)",
    border: "rgba(255, 255, 255, 0.10)",
    borderStrong: "rgba(255, 255, 255, 0.20)",
    text: "#ffffff",
    textSecondary: "rgba(255, 255, 255, 0.70)",
    textMuted: "rgba(255, 255, 255, 0.50)",
    textFaint: "rgba(255, 255, 255, 0.30)"
  };
}

export function uiFonts(): { mono: string; sans: string } {
  return {
    mono:
      'GeistMono, ui-monospace, SFMono-Regular, Roboto Mono, Menlo, Monaco, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace',
    sans:
      'Inter, "SF Pro Display", "Avenir Next", "Helvetica Neue", "Pretendard Variable", Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif'
  };
}

export function uiStyle(): string {
  const { mono, sans } = uiFonts();
  return `
    .mono { font-family: ${mono}; }
    .sans { font-family: ${sans}; }
    .cap { letter-spacing: 1.4px; text-transform: uppercase; }
  `;
}

export function uiDivider(x1: number, y: number, x2: number, stroke: string): string {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${escapeXml(stroke)}" />`;
}

export function uiBadge(
  x: number,
  y: number,
  text: string,
  tokens: UiTokens,
  options: { paddingX?: number; paddingY?: number; radius?: number } = {}
): string {
  const px = options.paddingX ?? 8;
  const py = options.paddingY ?? 5;
  const r = options.radius ?? 0;
  // crude width estimate: monospace ~0.62em per char at 12px
  const w = Math.ceil(px * 2 + text.length * 12 * 0.62);
  const h = py * 2 + 12 + 2;
  return [
    roundedRect(x, y, w, h, r, { fill: "transparent", stroke: tokens.borderStrong, strokeWidth: 1 }),
    `<text x="${x + w / 2}" y="${y + h / 2 + 1}" class="mono cap" fill="${escapeXml(
      tokens.text
    )}" font-size="12" font-weight="400" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text>`
  ].join("");
}

export function uiCard(
  x: number,
  y: number,
  w: number,
  h: number,
  tokens: UiTokens,
  options: { radius?: number; strokeStrong?: boolean } = {}
): string {
  const r = options.radius ?? 0;
  const stroke = options.strokeStrong ? tokens.borderStrong : tokens.border;
  return roundedRect(x, y, w, h, r, { fill: tokens.surface, stroke, strokeWidth: 1 });
}

export function uiStatBlock(
  x: number,
  y: number,
  label: string,
  value: string,
  tokens: UiTokens,
  options: { width?: number; valueSize?: number; labelSize?: number } = {}
): string {
  const w = options.width ?? 120;
  const valueSize = options.valueSize ?? 24;
  const labelSize = options.labelSize ?? 10;
  const cx = x + w / 2;
  return [
    `<text x="${cx}" y="${y}" class="mono" fill="${escapeXml(
      tokens.text
    )}" font-size="${valueSize}" font-weight="700" text-anchor="middle" dominant-baseline="hanging">${escapeXml(value)}</text>`,
    `<text x="${cx}" y="${y + valueSize + 10}" class="mono cap" fill="${escapeXml(
      tokens.textMuted
    )}" font-size="${labelSize}" font-weight="500" text-anchor="middle" dominant-baseline="hanging">${escapeXml(label)}</text>`
  ].join("");
}

export function attrs(input: Record<string, string | number | boolean | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) continue;
    if (typeof v === "boolean") {
      if (v) parts.push(`${k}="${k}"`);
      continue;
    }
    parts.push(`${k}="${escapeXml(String(v))}"`);
  }
  return parts.join(" ");
}

export function textEl(
  content: string,
  x: number,
  y: number,
  options: {
    fill?: string;
    fontSize?: number;
    fontWeight?: number | string;
    opacity?: number;
    textAnchor?: "start" | "middle" | "end";
    dominantBaseline?: "auto" | "middle" | "hanging";
  } = {}
): string {
  return `<text ${attrs({
    x,
    y,
    fill: options.fill,
    "font-size": options.fontSize,
    "font-weight": options.fontWeight,
    opacity: options.opacity,
    "text-anchor": options.textAnchor,
    "dominant-baseline": options.dominantBaseline
  })}>${escapeXml(content)}</text>`;
}

export function roundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  r: number,
  options: { fill?: string; stroke?: string; strokeWidth?: number } = {}
): string {
  return `<rect ${attrs({
    x,
    y,
    width,
    height,
    rx: r,
    ry: r,
    fill: options.fill,
    stroke: options.stroke,
    "stroke-width": options.strokeWidth
  })} />`;
}

export function progressBar(
  x: number,
  y: number,
  width: number,
  height: number,
  ratio: number,
  options: { bg: string; fg: string; r?: number } = { bg: "#e5e7eb", fg: "#111827" }
): string {
  const r = options.r ?? Math.min(height / 2, 8);
  const w = clamp(ratio, 0, 1) * width;
  return [
    roundedRect(x, y, width, height, r, { fill: options.bg }),
    roundedRect(x, y, w, height, r, { fill: options.fg })
  ].join("");
}

export function svgDoc(
  options: SvgCardOptions,
  body: string,
  extra: { defs?: string; style?: string } = {}
): string {
  const r = options.borderRadius ?? 12;
  const titleY = 28;
  const subtitleY = 48;
  const header = [
    `<svg ${attrs({
      xmlns: "http://www.w3.org/2000/svg",
      width: options.width,
      height: options.height,
      viewBox: `0 0 ${options.width} ${options.height}`,
      role: "img",
      "aria-label": options.title ?? "GitHub stats"
    })}>`,
    extra.defs ? `<defs>${extra.defs}</defs>` : "",
    extra.style ? `<style>${extra.style}</style>` : "",
    `<g>`,
    roundedRect(0, 0, options.width, options.height, r, {
      fill: options.theme.bg,
      stroke: options.theme.border,
      strokeWidth: 1
    }),
    `</g><g>`
  ].join("");

  const titleBlock =
    options.title || options.subtitle
      ? [
          options.title
            ? textEl(options.title, 18, titleY, {
                fill: options.theme.title,
                fontSize: 16,
                fontWeight: 700,
                dominantBaseline: "middle"
              })
            : "",
          options.subtitle
            ? textEl(options.subtitle, 18, subtitleY, {
                fill: options.theme.muted,
                fontSize: 12,
                fontWeight: 500,
                dominantBaseline: "middle"
              })
            : ""
        ].join("")
      : "";

  const footer = `</g></svg>`;
  return `${header}${titleBlock}${body}${footer}`;
}

export function errorSvg(message: string, theme: SvgTheme): string {
  const width = 420;
  const height = 120;
  const body = [
    textEl("⚠️ GitHub Stats", 18, 70, { fill: theme.title, fontSize: 16, fontWeight: 700 }),
    textEl(message, 18, 92, { fill: theme.muted, fontSize: 12, fontWeight: 500 })
  ].join("");
  return svgDoc({ width, height, title: "", subtitle: "", theme }, body);
}

