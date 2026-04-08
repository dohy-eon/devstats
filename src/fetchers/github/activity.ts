import { githubGraphql } from "./client";

export type GitHubActivityStats = {
  totalCommits: number;
  totalPrs: number;
  mergedPrsAllTime: number;
};

type ActivityQueryData = {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
    };
  } | null;
  mergedPrs: {
    issueCount: number;
  };
};

const ACTIVITY_QUERY = /* GraphQL */ `
  query Activity($login: String!, $from: DateTime!, $to: DateTime!, $mergedQuery: String!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
      }
    }
    mergedPrs: search(query: $mergedQuery, type: ISSUE, first: 1) {
      issueCount
    }
  }
`;

function yearRangeUTC(year: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0)).toISOString();
  const to = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0)).toISOString();
  return { from, to };
}

function rolling365RangeUTC(now: Date = new Date()): { from: string; to: string } {
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const from = new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: new Date(to.getTime() + 24 * 60 * 60 * 1000).toISOString() };
}

export async function fetchActivityStats(login: string, options: { year?: number } = {}): Promise<GitHubActivityStats> {
  const { from, to } = options.year ? yearRangeUTC(options.year) : rolling365RangeUTC();
  const mergedQuery = `is:pr author:${login} is:merged`;

  const data = await githubGraphql<ActivityQueryData>(ACTIVITY_QUERY, { login, from, to, mergedQuery });
  if (!data.user) throw new Error("User not found");

  return {
    totalCommits: data.user.contributionsCollection.totalCommitContributions,
    totalPrs: data.user.contributionsCollection.totalPullRequestContributions,
    mergedPrsAllTime: data.mergedPrs.issueCount
  };
}

