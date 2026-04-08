export type GraphQLError = { message: string };
export type GraphQLResponse<T> = { data?: T; errors?: GraphQLError[] };

export type GitHubGraphqlClientOptions = {
  token?: string;
  userAgent?: string;
};

function getGitHubToken(explicit?: string): string {
  const token = explicit ?? process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Missing GITHUB_TOKEN");
  return token;
}

export async function githubGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  options: GitHubGraphqlClientOptions = {}
): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getGitHubToken(options.token)}`,
      "User-Agent": options.userAgent ?? "devstats"
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

