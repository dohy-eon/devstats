# devstats

[English README](./README.en.md)

> **GitHub 프로필을 xAI 스타일의 미니멀한 SVG 카드로 바꿔 보세요.**  
> `devstats`는 Vercel Serverless Functions와 GitHub API로 실시간 활동·통계를 SVG로 렌더링하는 오픈소스입니다.

## Preview

![devstats preview](./preview-180.svg)

## 빠른 시작

아래 마크다운을 **그대로 복사**해 본인 GitHub 프로필 `README.md`에 붙여넣으세요.  
`username=` 뒤에 **GitHub 사용자명**만 바꾸면 됩니다.

### 1. 종합 통계 카드

커밋·PR·이슈·스타 등 활동을 한 장에 표시합니다.

```md
[![Stats Card](https://devstats-taupe.vercel.app/api/card?username=YOUR_USERNAME)](https://github.com/dohy-eon/devstats)
```

### 2. 주요 언어

레포지토리 기준 상위 언어 비중을 보여 줍니다.

```md
[![Top Languages](https://devstats-taupe.vercel.app/api/langs?username=YOUR_USERNAME)](https://github.com/dohy-eon/devstats)
```

### 3. 커밋 스트릭

연속 기여 일수와 최장 스트릭을 표시합니다.

```md
[![Commit Streak](https://devstats-taupe.vercel.app/api/streak?username=YOUR_USERNAME)](https://github.com/dohy-eon/devstats)
```

## 커스텀 파라미터

URL 뒤에 `&`로 옵션을 이어 붙일 수 있습니다.

| 파라미터 | 설명 | 예시 |
| :--- | :--- | :--- |
| `theme` | 테마: `xai`, `nord`, `dracula`, `dark`, `default` | `&theme=nord` |
| `track` / `song` | Spotify 트랙 URL · URI · ID(프로필 뮤직 영역) | `&track=트랙ID또는URL` |
| `bg_color` | 배경색(hex, `#` 없이) | `&bg_color=1f2228` |
| `text_color`, `title_color`, `border_color`, `icon_color`, `muted_color` | 글자·테두리·강조색 등 | `&text_color=ffffff` |
| `year` | 통계 기준 연도(종합 카드) | `&year=2024` |
| `width` / `height` | 카드 크기(px, 종합 카드만, 서버에서 범위 제한) | `&width=800` |
| `current` / `longest` | 스트릭 숫자 직접 지정(종합·스트릭 카드) | `&current=5&longest=30` |
| `v` | GitHub README 이미지 캐시 무력화 | `&v=2` |

배포 주소: `https://devstats-taupe.vercel.app`

## 특징

- **미니멀 UI**: xAI(Grok) 계열 다크 톤에 맞춘 레이아웃(기본 테마 `xai`).
- **빠른 응답**: CDN 캐시 헤더(`s-maxage`, `stale-while-revalidate`)로 README 임베드에 적합.
- **Spotify**: `track=` / `song=`으로 카드에 곡 정보를 넣을 수 있습니다(배포 측 Spotify 설정이 필요할 수 있음).
- **SVG**: 브라우저·GitHub에서 스케일에 강한 벡터 이미지.

## 기술 스택

- **런타임**: Vercel Serverless Functions (Node.js)
- **언어**: TypeScript
- **데이터**: GitHub GraphQL API v4

---

**Powered by [devstats](https://github.com/dohy-eon/devstats)**
