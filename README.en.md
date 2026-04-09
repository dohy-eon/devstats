# devstats

[한국어 README](./README.md)

> **Redefine your GitHub profile with minimalist, xAI-inspired SVG cards.**  
> `devstats` is an open-source tool that renders real-time GitHub activity and stats as SVG images via Vercel Serverless Functions.

## Quick start

Copy the Markdown below into your profile **`README.md`**.  
Replace **`YOUR_USERNAME`** with your GitHub login.

### 1. Overall stats

Commits, PRs, issues, stars, and more on one card.

```md
[![Stats Card](https://devstats-taupe.vercel.app/api/card?username=YOUR_USERNAME)](https://github.com/dohy-eon/devstats)
```

### 2. Top languages

Show which languages you use most across your repositories.

```md
[![Top Languages](https://devstats-taupe.vercel.app/api/langs?username=YOUR_USERNAME)](https://github.com/dohy-eon/devstats)
```

### 3. Commit streak

Current streak and longest streak at a glance.

```md
[![Commit Streak](https://devstats-taupe.vercel.app/api/streak?username=YOUR_USERNAME)](https://github.com/dohy-eon/devstats)
```

## Query parameters

Append options with `&` after the URL.

| Parameter | Description | Example |
| :--- | :--- | :--- |
| `theme` | `xai`, `nord`, `dracula`, `dark`, `default` | `&theme=nord` |
| `track` / `song` | Spotify track URL, URI, or ID (profile music block) | `&track=…` |
| `bg_color` | Background hex (no `#`) | `&bg_color=1f2228` |
| `text_color`, `title_color`, `border_color`, `icon_color`, `muted_color` | Text, border, and accent colors | `&text_color=ffffff` |
| `year` | Calendar year for activity stats (overall card) | `&year=2024` |
| `width` / `height` | Card size in px (overall card only; clamped server-side) | `&width=800` |
| `current` / `longest` | Override streak numbers (overall & streak cards) | `&current=5&longest=30` |
| `v` | Bust GitHub’s README image cache | `&v=2` |

Production base URL: `https://devstats-taupe.vercel.app`

## Highlights

- **Minimal layout**: Dark-first design aligned with an xAI-style aesthetic (default theme: `xai`).
- **Fast for README embeds**: Cache headers (`s-maxage`, `stale-while-revalidate`) suited to CDN and GitHub image caching.
- **Spotify**: Optional `track=` / `song=` for a profile-music row (may require Spotify credentials on the deployment).
- **SVG**: Crisp at any scale in browsers and on GitHub.

## Tech stack

- **Runtime**: Vercel Serverless Functions (Node.js)
- **Language**: TypeScript
- **Data**: GitHub GraphQL API v4

---

**Powered by [devstats](https://github.com/dohy-eon/devstats)**
