import type { SvgTheme } from "../utils/svg";
import { svgDoc, textEl } from "../utils/svg";

export type StreakInput = {
  username: string;
  current: number;
  longest: number;
  theme: SvgTheme;
};

export function renderStreakCard(input: StreakInput): string {
  const width = 460;
  const height = 140;
  const { username, current, longest, theme } = input;

  const body: string[] = [];
  body.push(
    textEl(`${username} · Streak`, 18, 28, {
      fill: theme.title,
      fontSize: 16,
      fontWeight: 800,
      dominantBaseline: "middle"
    })
  );

  body.push(
    textEl("현재 스트릭", 18, 68, { fill: theme.muted, fontSize: 12, fontWeight: 600, dominantBaseline: "middle" })
  );
  body.push(
    textEl(`${current} days`, 160, 68, {
      fill: theme.text,
      fontSize: 22,
      fontWeight: 900,
      dominantBaseline: "middle"
    })
  );

  body.push(
    textEl("최장 스트릭", 18, 104, { fill: theme.muted, fontSize: 12, fontWeight: 600, dominantBaseline: "middle" })
  );
  body.push(
    textEl(`${longest} days`, 160, 104, {
      fill: theme.text,
      fontSize: 18,
      fontWeight: 800,
      dominantBaseline: "middle"
    })
  );

  return svgDoc({ width, height, theme }, body.join(""));
}

export function renderFallbackStreak(message: string, theme: SvgTheme): string {
  const width = 460;
  const height = 140;
  const body = [
    textEl("Streak", 18, 34, { fill: theme.title, fontSize: 16, fontWeight: 800 }),
    textEl("요청을 처리하지 못했습니다.", 18, 62, { fill: theme.text, fontSize: 12, fontWeight: 600 }),
    textEl(message, 18, 84, { fill: theme.muted, fontSize: 11, fontWeight: 500, opacity: 0.9 })
  ].join("");
  return svgDoc({ width, height, theme }, body);
}

