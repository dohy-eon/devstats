# devstats
Custom GitHub stats cards powered by Vercel SVG API.

## 기능
- **Vercel Serverless API**로 SVG 카드 생성
- **GitHub GraphQL API**로 유저/리포/언어 통계 조회
- **캐싱 헤더**: `s-maxage`, `stale-while-revalidate`
- **에러 처리**: 실패 시 fallback SVG 반환

## API
- **`/api/card?username=xxx`**
- **`/api/langs?username=xxx`**
- **`/api/streak?username=xxx&current=xx&longest=xx`**

추가 옵션:
- `theme`: `default | dark | nord | dracula`
- `bg_color`, `text_color`, `title_color`, `icon_color`, `border_color`: `fff` 또는 `17171B` 같은 hex (선택)
- `hide`: `stars,forks,followers,contribs` 중 콤마로 숨김 (선택)

예시:

```bash
curl "http://localhost:3000/api/card?username=octocat"
curl "http://localhost:3000/api/langs?username=octocat"
curl "http://localhost:3000/api/streak?username=octocat&current=12&longest=34"
```

## README에 이미지로 임베드
배포 후(예: `https://YOUR_APP.vercel.app`) 아래처럼 **링크 한 줄**로 카드가 뜹니다.

```md
![Dohyeon's GitHub stats](https://YOUR_APP.vercel.app/api/card?username=dohy-eon&hide=stars&bg_color=fff&text_color=17171B&title_color=17171B&icon_color=17171B)
```

## 환경변수
- **`GITHUB_TOKEN`**: GitHub GraphQL 호출에 필요합니다.

로컬에서:

```bash
export GITHUB_TOKEN="YOUR_TOKEN"
```

Vercel에 배포 시:
- Project Settings → Environment Variables에 `GITHUB_TOKEN` 추가

## 로컬 실행

```bash
npm install
npx vercel dev --listen 3000 --yes
```

## 개발 구조
- **fetchers**: `src/fetchers/github/*` (GitHub GraphQL fetching)
- **renderers**: `src/renderers/*` (SVG 렌더링)
- **themes**: `src/themes/*`
- **utils**: `src/utils/svg.ts`
