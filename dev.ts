import fs from "node:fs";
import path from "node:path";
import { renderCard } from "./src/renderers/card";
import { resolveTheme } from "./src/themes";

type Mock = {
  username: string;
  year: number;
  theme?: string;
  user: { login: string };
  activity: { totalCommitsLastYear: number; totalPrsLastYear: number };
  langs: { totalBytes: number; top: Array<{ name: string; bytes: number }> };
  nowPlaying?: {
    status: "profile";
    track: string;
    artists: string;
    url?: string;
  };
  streak: { current: number; longest: number };
};

const cwd = process.cwd();
const mockPath = path.join(cwd, "mock.json");
const outPath = path.join(cwd, "preview.svg");

const raw = fs.readFileSync(mockPath, "utf8");
const mock = JSON.parse(raw) as Mock;

const svg = renderCard({
  user: { login: mock.user.login } as any,
  activity: {
    totalCommits: mock.activity.totalCommitsLastYear,
    totalPrs: mock.activity.totalPrsLastYear
  } as any,
  langs: {
    totalBytes: mock.langs.totalBytes,
    top: mock.langs.top.map((l) => ({ name: l.name, bytes: l.bytes, color: (l as any).color ?? null })) as any
  },
  streak: { current: mock.streak.current, longest: mock.streak.longest },
  nowPlaying: mock.nowPlaying,
  year: `${mock.year}`,
  theme: resolveTheme(mock.theme)
});

fs.writeFileSync(outPath, svg, "utf8");
console.log(`updated ${path.relative(cwd, outPath)}`);
