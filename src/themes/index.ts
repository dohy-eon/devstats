import type { SvgTheme } from "../utils/svg";

export type ThemeName = "default" | "dark" | "nord" | "dracula" | "xai" | "light";
export type ThemeOverrides = Partial<Pick<SvgTheme, "bg" | "border" | "title" | "text" | "muted" | "accent" | "shadow">>;

const THEME_ALIASES: Record<string, ThemeName> = {
  white: "light"
};

const THEMES: Record<ThemeName, SvgTheme> = {
  default: {
    bg: "#ffffff",
    border: "#e5e7eb",
    title: "#111827",
    text: "#111827",
    muted: "#6b7280",
    accent: "#2563eb",
    shadow: "#111827",
    surface: "rgba(0, 0, 0, 0.02)",
    surfaceBorder: "rgba(0, 0, 0, 0.12)",
    surfaceMuted: "rgba(0, 0, 0, 0.06)"
  },
  dark: {
    bg: "#0b1020",
    border: "#1f2937",
    title: "#f9fafb",
    text: "#e5e7eb",
    muted: "#9ca3af",
    accent: "#60a5fa",
    shadow: "#000000"
  },
  nord: {
    bg: "#2e3440",
    border: "#3b4252",
    title: "#eceff4",
    text: "#e5e9f0",
    muted: "#d8dee9",
    accent: "#88c0d0",
    shadow: "#000000"
  },
  dracula: {
    bg: "#282a36",
    border: "#44475a",
    title: "#f8f8f2",
    text: "#f8f8f2",
    muted: "#bd93f9",
    accent: "#50fa7b",
    shadow: "#000000"
  },
  xai: {
    bg: "#1f2228",
    border: "rgba(255, 255, 255, 0.1)",
    title: "#ffffff",
    text: "#ffffff",
    muted: "rgba(255, 255, 255, 0.5)",
    accent: "#ffffff",
    surface: "rgba(255, 255, 255, 0.03)",
    surfaceBorder: "rgba(255, 255, 255, 0.20)",
    surfaceMuted: "rgba(255, 255, 255, 0.07)"
  },
  light: {
    bg: "#ffffff",
    border: "rgba(0, 0, 0, 0.10)",
    title: "#0d1117",
    text: "#0d1117",
    muted: "rgba(13, 17, 23, 0.50)",
    accent: "#0969da",
    shadow: "#000000",
    surface: "rgba(0, 0, 0, 0.02)",
    surfaceBorder: "rgba(0, 0, 0, 0.12)",
    surfaceMuted: "rgba(0, 0, 0, 0.06)"
  }
};

export function getTheme(name: string | undefined): SvgTheme {
  const raw = name ?? "default";
  const key = (THEME_ALIASES[raw] ?? raw) as ThemeName;
  return THEMES[key] ?? THEMES.default;
}

export function resolveTheme(name: string | undefined, overrides: ThemeOverrides = {}): SvgTheme {
  const raw = name ?? "default";
  const key = (THEME_ALIASES[raw] ?? raw) as ThemeName;
  return { ...(THEMES[key] ?? THEMES.default), ...overrides };
}

