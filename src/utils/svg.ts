export type SvgTheme = {
  bg: string;
  border: string;
  title: string;
  text: string;
  muted: string;
  accent: string;
  shadow?: string;
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
    options.theme.shadow
      ? `<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="${escapeXml(
            options.theme.shadow
          )}" flood-opacity="0.18"/>
        </filter>`
      : "",
    `<g ${attrs({ filter: options.theme.shadow ? "url(#shadow)" : undefined })}>`,
    roundedRect(0, 0, options.width, options.height, r, {
      fill: options.theme.bg,
      stroke: options.theme.border,
      strokeWidth: 1
    }),
    `</g>`,
    `<g>`
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

