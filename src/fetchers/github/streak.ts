export type GitHubStreak = {
  current: number;
  longest: number;
  // YYYY-MM-DD of the last day considered for current streak (usually "today" in the dataset)
  asOf: string;
};

type DayEntry = { date: string; count: number };

function toUtcDay(date: string): number {
  // date: YYYY-MM-DD
  const parts = date.split("-");
  const y = Number.parseInt(parts[0] ?? "0", 10);
  const m = Number.parseInt(parts[1] ?? "1", 10);
  const d = Number.parseInt(parts[2] ?? "1", 10);
  return Date.UTC(y, m - 1, d) / 86400000;
}

function daysBetween(a: string, b: string): number {
  return toUtcDay(b) - toUtcDay(a);
}

function parseContributionCounts(html: string): Array<{ date: string; count: number }> {
  // GitHub contributions page commonly contains: data-date="YYYY-MM-DD" data-count="N"
  const out: DayEntry[] = [];

  // In SVG/HTML, attribute order is not guaranteed. Support both orders.
  const re1 = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-count="(\d+)"/g;
  const re2 = /data-count="(\d+)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"/g;
  let m: RegExpExecArray | null;
  while ((m = re1.exec(html))) {
    out.push({ date: m[1]!, count: Number.parseInt(m[2]!, 10) });
  }
  while ((m = re2.exec(html))) {
    out.push({ date: m[2]!, count: Number.parseInt(m[1]!, 10) });
  }

  if (out.length) return out;

  // Fallback: aria-label="N contributions on YYYY-MM-DD"
  const reAria =
    /aria-label="(\d+)\s+contributions?\s+on\s+(\d{4}-\d{2}-\d{2})"/g;
  while ((m = reAria.exec(html))) {
    out.push({ date: m[2]!, count: Number.parseInt(m[1]!, 10) });
  }

  return out;
}

export function computeStreak(entries: DayEntry[]): GitHubStreak {
  if (!entries.length) return { current: 0, longest: 0, asOf: "unknown" };

  // Deduplicate by date (prefer max count if duplicated)
  const map = new Map<string, number>();
  for (const e of entries) {
    const prev = map.get(e.date);
    if (prev === undefined || e.count > prev) map.set(e.date, e.count);
  }

  const dates = [...map.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const asOf = dates[dates.length - 1]!;

  // Longest streak across dataset
  let longest = 0;
  let run = 0;
  for (let i = 0; i < dates.length; i++) {
    const d = dates[i]!;
    const count = map.get(d) ?? 0;
    if (count > 0) {
      if (i === 0) {
        run = 1;
      } else {
        const prev = dates[i - 1]!;
        run = daysBetween(prev, d) === 1 ? run + 1 : 1;
      }
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  // Current streak: walk backwards from asOf
  let current = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = dates[i]!;
    const count = map.get(d) ?? 0;
    if (i === dates.length - 1) {
      if (count <= 0) break;
      current = 1;
      continue;
    }
    if (count <= 0) break;
    const next = dates[i + 1]!;
    if (daysBetween(d, next) !== 1) break;
    current += 1;
  }

  return { current, longest, asOf };
}

async function fetchStreakViaGraphql(login: string): Promise<GitHubStreak> {
  // Uses official GitHub GraphQL contribution calendar (requires GITHUB_TOKEN).
  const { githubGraphql } = await import("./client");

  type CalendarDay = { date: string; contributionCount: number };
  type CalendarWeek = { contributionDays: CalendarDay[] };
  type Data = {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          weeks: CalendarWeek[];
        };
      };
    } | null;
  };

  const query = /* GraphQL */ `
    query Streak($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const data = await githubGraphql<Data>(query, { login });
  if (!data.user) throw new Error("User not found");

  const days: DayEntry[] = [];
  for (const w of data.user.contributionsCollection.contributionCalendar.weeks) {
    for (const d of w.contributionDays) {
      days.push({ date: d.date, count: d.contributionCount });
    }
  }
  if (!days.length) throw new Error("No contribution calendar data");
  return computeStreak(days);
}

export async function fetchStreak(login: string): Promise<GitHubStreak> {
  // 1) Prefer GraphQL when token exists (more stable than HTML parsing).
  if (process.env.GITHUB_TOKEN) {
    try {
      return await fetchStreakViaGraphql(login);
    } catch {
      // Fall through to HTML parsing for resiliency.
    }
  }

  // 2) HTML fallback (best-effort).
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 6500);
  try {
    const url = `https://github.com/users/${encodeURIComponent(login)}/contributions`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "devstats",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: `https://github.com/${encodeURIComponent(login)}`
      },
      signal: ac.signal
    });
    if (!res.ok) throw new Error(`GitHub contributions fetch failed (${res.status})`);
    const html = await res.text();
    const entries = parseContributionCounts(html);
    if (!entries.length) throw new Error("Unable to parse contributions HTML");
    return computeStreak(entries);
  } finally {
    clearTimeout(t);
  }
}

