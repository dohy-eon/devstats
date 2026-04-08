# devstats

[English README](./README.en.md)

Vercel Serverless + GitHub API로 **SVG 기반 GitHub stats 카드**를 생성합니다.

## 기능
- **Vercel Serverless API**로 SVG 카드 생성
- **GitHub GraphQL API**로 유저/리포/언어 통계 조회
- **캐싱 헤더**: `s-maxage`, `stale-while-revalidate`
- **에러 처리**: 실패 시 fallback SVG 반환

## API
- **`/api/card?username=xxx`**
- **`/api/langs?username=xxx`**
- **`/api/streak?username=xxx`**

추가 옵션:
- `theme`: `default | dark | nord | dracula | xai`
- `bg_color`, `text_color`, `title_color`, `icon_color`, `border_color`: `fff` 또는 `17171B` 같은 hex (선택)
- (참고) 일부 파라미터는 엔드포인트/카드 디자인 변경에 따라 지원 범위가 달라질 수 있습니다.

예시:

```bash
curl "http://localhost:3000/api/card?username=octocat"
curl "http://localhost:3000/api/langs?username=octocat"
curl "http://localhost:3000/api/streak?username=octocat"
```

Spotify 프로필 뮤직(유저별 지정):
- `track=`(또는 `song=`)에 Spotify Track URL / URI / ID를 넣으면 해당 곡을 카드에 표시합니다.

```bash
curl "http://localhost:3000/api/card?username=octocat&track=https://open.spotify.com/track/<TRACK_ID>"
```

## README에 이미지로 임베드
프로덕션 배포 주소: `https://devstats-taupe.vercel.app`

아래처럼 **링크 한 줄**로 카드가 뜹니다.

```md
![Dohyeon's GitHub stats](https://devstats-taupe.vercel.app/api/card?username=dohy-eon&bg_color=1f2228&text_color=ffffff&title_color=ffffff&v=1)
```

참고: GitHub README 이미지 캐시 때문에 변경이 바로 반영되지 않으면 `v=1` 값을 `v=2`처럼 바꿔서 캐시를 깨면 됩니다.

## 환경변수
- **`GITHUB_TOKEN`**: GitHub GraphQL 호출에 필요합니다.
- (선택) **Spotify 프로필 뮤직(`track=`/`song=`)** 을 카드에 표시하려면 아래 2개가 필요합니다.
  - **`SPOTIFY_CLIENT_ID`**
  - **`SPOTIFY_CLIENT_SECRET`**

로컬에서:

```bash
export GITHUB_TOKEN="YOUR_TOKEN"
export SPOTIFY_CLIENT_ID="YOUR_ID"
export SPOTIFY_CLIENT_SECRET="YOUR_SECRET"
```

Vercel에 배포 시:
- Project Settings → Environment Variables에 `GITHUB_TOKEN` 추가
- Spotify를 쓰는 경우 위 3개도 함께 추가

Spotify 섹션은 `track=`(또는 `song=`)을 줄 때만 표시됩니다.

## 로컬 실행

```bash
npm install
npx vercel dev --listen 3000 --yes
```

## 로컬 SVG 프리뷰(배포 없이 디자인)

```bash
npm run dev:preview
```

- `mock.json` 저장 시 `preview.svg` 자동 업데이트
- `preview.html`을 브라우저로 열어 확인

## 개발 구조
- **fetchers**: `src/fetchers/github/*` (GitHub GraphQL fetching)
- **renderers**: `src/renderers/*` (SVG 렌더링)
- **themes**: `src/themes/*`
- **utils**: `src/utils/svg.ts`
