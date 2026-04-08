import { githubGraphql } from "./client";

export type GitHubActivityStats = {
  totalCommitsLastYear: number;
  totalPrsLastYear: number;
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

export async function fetchActivityStats(login: string, year: number = new Date().getUTCFullYear()): Promise<GitHubActivityStats> {
  const { from, to } = yearRangeUTC(year);
  const mergedQuery = `is:pr author:${login} is:merged`;

  const data = await githubGraphql<ActivityQueryData>(ACTIVITY_QUERY, { login, from, to, mergedQuery });
  if (!data.user) throw new Error("User not found");

  return {
    totalCommitsLastYear: data.user.contributionsCollection.totalCommitContributions,
    totalPrsLastYear: data.user.contributionsCollection.totalPullRequestContributions,
    mergedPrsAllTime: data.mergedPrs.issueCount
  };
}

