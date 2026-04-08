## devstats

[한국어 README](./README.md)

Generate **SVG GitHub stats cards** with Vercel Serverless and the GitHub API.

## Features
- **Vercel Serverless API** endpoints that return SVG (`image/svg+xml`)
- **GitHub GraphQL API** for user/repo/language stats
- **Caching headers**: `s-maxage`, `stale-while-revalidate`
- **Graceful errors**: fallback SVG on failures

## API
- **`/api/card?username=xxx`**
- **`/api/langs?username=xxx`**
- **`/api/streak?username=xxx`**

Optional:
- `theme`: `default | dark | nord | dracula | xai`
- `bg_color`, `text_color`, `title_color`, `icon_color`, `border_color`: hex like `fff` or `17171B`
- Note: supported params may vary as cards evolve.

Examples:

```bash
curl "http://localhost:3000/api/card?username=octocat"
curl "http://localhost:3000/api/langs?username=octocat"
curl "http://localhost:3000/api/streak?username=octocat"
```

## Embed in README
Production URL: `https://devstats-taupe.vercel.app`

You can embed a card with a single Markdown image:

```md
![Dohyeon's GitHub stats](https://devstats-taupe.vercel.app/api/card?username=dohy-eon&bg_color=1f2228&text_color=ffffff&title_color=ffffff&v=1)
```

Note: GitHub aggressively caches README images. If updates don’t show up, bump `v=1` to `v=2`.

## Environment variables
- **`GITHUB_TOKEN`**: required for GitHub GraphQL requests.

Local:

```bash
export GITHUB_TOKEN="YOUR_TOKEN"
```

On Vercel:
- Project Settings → Environment Variables → add `GITHUB_TOKEN`

## Local dev

```bash
npm install
npx vercel dev --listen 3000 --yes
```

## Project structure
- **fetchers**: `src/fetchers/github/*`
- **renderers**: `src/renderers/*`
- **themes**: `src/themes/*`
- **utils**: `src/utils/svg.ts`

