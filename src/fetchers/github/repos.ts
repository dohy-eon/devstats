export type RepoStats = {
  name: string;
  stargazers: number;
  forks: number;
  isFork: boolean;
  isArchived: boolean;
};

type GraphQLError = { message: string };
type GraphQLResponse<T> = { data?: T; errors?: GraphQLError[] };

function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Missing GITHUB_TOKEN");
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
  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? "GitHub API error");
  }
  if (!json.data) throw new Error("GitHub API returned no data");
  return json.data;
}

type RepoNode = {
  name: string;
  isFork: boolean;
  isArchived: boolean;
  stargazerCount: number;
  forkCount: number;
};

type ReposQueryData = {
  user: {
    repositories: {
      nodes: (RepoNode | null)[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  } | null;
};

const REPOS_QUERY = /* GraphQL */ `
  query Repos($login: String!, $after: String) {
    user(login: $login) {
      repositories(
        first: 100
        after: $after
        ownerAffiliations: OWNER
        privacy: PUBLIC
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          name
          isFork
          isArchived
          stargazerCount
          forkCount
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export async function fetchRepos(login: string, limit = 200): Promise<RepoStats[]> {
  const out: RepoStats[] = [];
  let after: string | null = null;

  while (out.length < limit) {
    const data: ReposQueryData = await githubGraphql<ReposQueryData>(REPOS_QUERY, { login, after });
    if (!data.user) throw new Error("User not found");

    const nodes = data.user.repositories.nodes;
    for (const n of nodes) {
      if (!n) continue;
      out.push({
        name: n.name,
        stargazers: n.stargazerCount,
        forks: n.forkCount,
        isFork: n.isFork,
        isArchived: n.isArchived
      });
      if (out.length >= limit) break;
    }

    const pi: { hasNextPage: boolean; endCursor: string | null } = data.user.repositories.pageInfo;
    if (!pi.hasNextPage || !pi.endCursor) break;
    after = pi.endCursor;
  }

  return out;
}

export function summarizeRepos(repos: RepoStats[]): {
  totalStars: number;
  totalForks: number;
  repoCount: number;
} {
  let totalStars = 0;
  let totalForks = 0;
  let repoCount = 0;
  for (const r of repos) {
    if (r.isFork) continue;
    repoCount += 1;
    totalStars += r.stargazers;
    totalForks += r.forks;
  }
  return { totalStars, totalForks, repoCount };
}

