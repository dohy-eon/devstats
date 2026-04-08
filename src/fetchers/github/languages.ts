export type LanguageStat = {
  name: string;
  color: string | null;
  bytes: number;
};

import { githubGraphql } from "./client";

type LanguageEdge = {
  size: number;
  node: { name: string; color: string | null };
};

type RepoWithLangs = {
  name: string;
  isFork: boolean;
  isArchived: boolean;
  languages: { edges: (LanguageEdge | null)[] };
};

type LangsQueryData = {
  user: {
    repositories: {
      nodes: (RepoWithLangs | null)[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  } | null;
};

const LANGS_QUERY = /* GraphQL */ `
  query Langs($login: String!, $after: String) {
    user(login: $login) {
      repositories(first: 50, after: $after, ownerAffiliations: OWNER, privacy: PUBLIC) {
        nodes {
          name
          isFork
          isArchived
          languages(first: 8, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export async function fetchTopLanguages(
  login: string,
  options: { maxRepos?: number; topN?: number } = {}
): Promise<{ totalBytes: number; top: LanguageStat[] }> {
  const maxRepos = options.maxRepos ?? 200;
  const topN = options.topN ?? 6;

  const map = new Map<string, { bytes: number; color: string | null }>();
  let totalBytes = 0;

  let after: string | null = null;
  let seenRepos = 0;

  while (seenRepos < maxRepos) {
    const data: LangsQueryData = await githubGraphql<LangsQueryData>(LANGS_QUERY, { login, after });
    if (!data.user) throw new Error("User not found");

    const repos = data.user.repositories.nodes;
    for (const repo of repos) {
      if (!repo) continue;
      seenRepos += 1;
      if (repo.isFork || repo.isArchived) continue;

      for (const edge of repo.languages.edges) {
        if (!edge) continue;
        totalBytes += edge.size;
        const cur = map.get(edge.node.name);
        if (!cur) {
          map.set(edge.node.name, { bytes: edge.size, color: edge.node.color });
        } else {
          cur.bytes += edge.size;
          if (!cur.color && edge.node.color) cur.color = edge.node.color;
        }
      }

      if (seenRepos >= maxRepos) break;
    }

    const pi: { hasNextPage: boolean; endCursor: string | null } = data.user.repositories.pageInfo;
    if (!pi.hasNextPage || !pi.endCursor) break;
    after = pi.endCursor;
  }

  const sorted: LanguageStat[] = [...map.entries()]
    .map(([name, v]) => ({ name, bytes: v.bytes, color: v.color }))
    .sort((a, b) => b.bytes - a.bytes);

  const top = sorted.slice(0, topN);
  return { totalBytes, top };
}

