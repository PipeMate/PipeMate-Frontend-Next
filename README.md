# PipeMate Frontend Next.js

GitHub Actions 워크플로우를 시각적으로 구성할 수 있는 프론트엔드 애플리케이션입니다.

## 환경 설정

### 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경변수들을 설정하세요:

```bash
  # API 설정
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### 환경변수 설명

- `NEXT_PUBLIC_API_BASE_URL`: 백엔드 API 기본 URL

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 주요 기능

- GitHub Actions 워크플로우 시각적 구성
- 블록 기반 워크플로우 에디터
- 프리셋 블록 및 파이프라인 제공
- YAML 변환 및 GitHub 업로드
- 실시간 워크플로우 실행 모니터링

## 기술 스택

- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI Library**: React
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Flow Editor**: React Flow
- **HTTP Client**: Fetch API
