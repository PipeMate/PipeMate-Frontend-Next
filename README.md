# 프론트 프로젝트 협업 가이드 및 컨벤션

이 문서는 Next.js 기반 프로젝트의 **협업 규칙**과 개발 컨벤션을 정리한 가이드입니다. 새로운 팀원이 빠르게 프로젝트에 적응하고, 일관된 코드와 효율적인 협업이 이루어질 수 있도록 작성되었습니다.

## 1. 프로젝트 개요

- **프레임워크**: Next.js (React 기반)
- **초기화 도구**: [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) 사용 
- **주요 특징**:
  - App Router 구조
  - TypeScript 기반
  - Tailwind CSS, ESLint 등 추가 도구는 설정에 따라 다를 수 있음

## 2. 개발 환경 세팅

### 2.1. 의존성 설치

아래 명령어 중 하나를 사용하여 패키지를 설치하세요.

```bash
npm install
# 또는
yarn install
# 또는
pnpm install
# 또는
bun install
```

### 2.2. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
# 또는
bun dev
```

- 개발 서버 기본 주소: [http://localhost:3000](http://localhost:3000)

## 3. 프로젝트 구조 및 파일 관리

- **메인 페이지**: `app/page.tsx`
- **컴포넌트/모듈**: 기능별로 `app/components`, `app/modules` 등으로 분리하여 관리합니다.
- **스타일**: Tailwind CSS 또는 글로벌 스타일 시트(`globals.css`)를 사용합니다.
- **폰트**: [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)로 폰트 최적화, 기본 폰트는 [Geist](https://vercel.com/font) 사용

## 4. 코드 컨벤션

- **언어**: TypeScript 권장
- **코딩 스타일**: Prettier, ESLint 적용
- **폴더/파일명**: camelCase 사용
- **컴포넌트 명명**: PascalCase 사용
- **주석**: 함수/컴포넌트 상단에 JSDoc 스타일로 작성
- **커밋 메시지**: [Conventional Commits](https://www.conventionalcommits.org/) 규칙 준수

## 5. 협업 규칙

- **브랜치 전략**: 
  - `main`: 배포용
  - `feat/브랜치명`: 기능 개발
  - Pull Request(PR)로 코드 리뷰 필수
- **이슈 관리**: GitHub Issues 사용, 작업 시작 전 할당
- **코드 리뷰**: 최소 1명 이상의 승인 필요
- **문서화**: 주요 변경사항은 README 또는 별도 문서에 기록

## 6. 배포

- **플랫폼**: [Vercel](https://vercel.com/) 권장
- **배포 방법**: Vercel 연동 또는 수동 배포
- **참고 문서**: [Next.js 배포 가이드](https://nextjs.org/docs/app/building-your-application/deploying)

## 7. 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Next.js 튜토리얼](https://nextjs.org/learn)
- [Next.js GitHub](https://github.com/vercel/next.js)

이 가이드는 프로젝트의 일관성과 효율적인 협업을 위해 지속적으로 업데이트될 수 있습니다. 궁금한 점이나 개선 사항이 있다면 언제든지 팀에 공유해주세요.