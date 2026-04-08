import type { SvgTheme } from "../utils/svg";

export type ThemeName = "default" | "dark" | "nord" | "dracula" | "xai";
export type ThemeOverrides = Partial<Pick<SvgTheme, "bg" | "border" | "title" | "text" | "muted" | "accent" | "shadow">>;

const THEMES: Record<ThemeName, SvgTheme> = {
  default: {
    bg: "#ffffff",
    border: "#e5e7eb",
    title: "#111827",
    text: "#111827",
    muted: "#6b7280",
    accent: "#2563eb",
    shadow: "#111827"
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
    muted: "rgba(255, 255, 255, 0.7)",
    accent: "#ffffff"
  }
};

export function getTheme(name: string | undefined): SvgTheme {
  const key = (name ?? "default") as ThemeName;
  return THEMES[key] ?? THEMES.default;
}

export function resolveTheme(name: string | undefined, overrides: ThemeOverrides = {}): SvgTheme {
  return { ...getTheme(name), ...overrides };
}

