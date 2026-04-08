import type { GitHubUser } from "../fetchers/github/user";
import type { SvgTheme } from "../utils/svg";
import { progressBar, svgDoc, textEl } from "../utils/svg";

export type CardStats = {
  totalStars: number;
  totalForks: number;
  repoCount: number;
};

export type CardMetricKey = "contribs" | "stars" | "forks" | "followers";

export function renderUserCard(input: {
  user: GitHubUser;
  stats: CardStats;
  theme: SvgTheme;
  hide?: ReadonlySet<CardMetricKey>;
}): string {
  const width = 460;
  const { user, stats, theme } = input;
  const hide = input.hide ?? new Set<CardMetricKey>();
  const displayName = user.name?.trim() ? user.name : user.login;

  const max = Math.max(stats.totalStars, stats.totalForks, user.followers, 1);

  const rows: { key: CardMetricKey; label: string; value: number; ratio: number }[] = [];
  if (!hide.has("contribs")) {
    rows.push({
      key: "contribs",
      label: "Contributions (1y)",
      value: user.contributionsLastYear,
      ratio: user.contributionsLastYear / Math.max(user.contributionsLastYear, 1)
    });
  }
  if (!hide.has("stars")) rows.push({ key: "stars", label: "Stars", value: stats.totalStars, ratio: stats.totalStars / max });
  if (!hide.has("forks")) rows.push({ key: "forks", label: "Forks", value: stats.totalForks, ratio: stats.totalForks / max });
  if (!hide.has("followers"))
    rows.push({ key: "followers", label: "Followers", value: user.followers, ratio: user.followers / max });

  const startY = 64;
  const rowH = 24;
  const barX = 210;
  const barW = 220;

  const minHeight = 120;
  const contentHeight = startY + rows.length * rowH + 10;
  const height = Math.max(minHeight, contentHeight);

  const body: string[] = [];
  body.push(
    textEl(displayName, 18, 28, {
      fill: theme.title,
      fontSize: 16,
      fontWeight: 800,
      dominantBaseline: "middle"
    })
  );
  body.push(
    textEl(`@${user.login} · ${stats.repoCount} repos`, 18, 50, {
      fill: theme.muted,
      fontSize: 12,
      fontWeight: 500,
      dominantBaseline: "middle"
    })
  );

  rows.forEach((row, i) => {
    const y = startY + i * rowH;
    body.push(
      textEl(row.label, 18, y, {
        fill: theme.text,
        fontSize: 12,
        fontWeight: 600,
        dominantBaseline: "middle"
      })
    );
    body.push(
      textEl(row.value.toLocaleString("en-US"), 190, y, {
        fill: theme.muted,
        fontSize: 12,
        fontWeight: 600,
        textAnchor: "end",
        dominantBaseline: "middle"
      })
    );
    body.push(progressBar(barX, y - 6, barW, 10, row.ratio, { bg: theme.border, fg: theme.accent, r: 6 }));
  });

  return svgDoc({ width, height, theme }, body.join(""));
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

