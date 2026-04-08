export type GitHubUser = {
  login: string;
  name: string | null;
  avatarUrl: string;
  followers: number;
  following: number;
  publicRepos: number;
  contributionsLastYear: number;
};

import { githubGraphql } from "./client";

type UserQueryData = {
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    followers: { totalCount: number };
    following: { totalCount: number };
    repositories: { totalCount: number };
    contributionsCollection: {
      contributionCalendar: { totalContributions: number };
    };
  } | null;
};

const USER_QUERY = /* GraphQL */ `
  query User($login: String!) {
    user(login: $login) {
      login
      name
      avatarUrl(size: 96)
      followers {
        totalCount
      }
      following {
        totalCount
      }
      repositories(privacy: PUBLIC) {
        totalCount
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
        }
      }
    }
  }
`;

export async function fetchUser(login: string): Promise<GitHubUser> {
  const data = await githubGraphql<UserQueryData>(USER_QUERY, { login });
  if (!data.user) throw new Error("User not found");

  return {
    login: data.user.login,
    name: data.user.name,
    avatarUrl: data.user.avatarUrl,
    followers: data.user.followers.totalCount,
    following: data.user.following.totalCount,
    publicRepos: data.user.repositories.totalCount,
    contributionsLastYear: data.user.contributionsCollection.contributionCalendar.totalContributions
  };
}

