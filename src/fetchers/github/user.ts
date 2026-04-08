export type GitHubUser = {
  login: string;
  name: string | null;
  avatarUrl: string;
  followers: number;
  following: number;
  publicRepos: number;
  contributionsLastYear: number;
};

type GraphQLError = { message: string };
type GraphQLResponse<T> = { data?: T; errors?: GraphQLError[] };

function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN");
  }
  return token;
}

async function githubGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getGitHubToken()}`,
      "User-Agent": "devstats"
    },
    body: JSON.stringify({ query, variables })
  });

  const json = (await res.json()) as GraphQLResponse<T>;

  if (!res.ok) {
    const msg = json.errors?.[0]?.message ?? `GitHub API error (${res.status})`;
    throw new Error(msg);
  }
  if (json.errors?.length) throw new Error(json.errors[0]?.message ?? "GitHub API error");
  if (!json.data) {
    throw new Error("GitHub API returned no data");
  }
  return json.data;
}

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

