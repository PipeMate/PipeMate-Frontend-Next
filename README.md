# PipeMate Frontend Next.js

GitHub Actions 워크플로우를 시각적으로 구성할 수 있는 프론트엔드 애플리케이션입니다.

## 환경 설정

### 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경변수들을 설정하세요:

```bash
  # API 설정
  NEXT_PUBLIC_USE_REAL_API=false
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

  # GitHub 설정
  NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id_here
  GITHUB_CLIENT_SECRET=your_github_client_secret_here

  # 기타 설정
  NODE_ENV=development
  PORT=3000
```

### 환경변수 설명

- `NEXT_PUBLIC_USE_REAL_API`: 실제 백엔드 API 사용 여부
  - `false`: 목 데이터 사용 (개발용)
  - `true`: 실제 백엔드 API 사용 (프로덕션용)
- `NEXT_PUBLIC_API_BASE_URL`: 백엔드 API 기본 URL
- `NEXT_PUBLIC_GITHUB_CLIENT_ID`: GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth App Client Secret

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

## API 사용 방법

### 목 데이터 사용 (개발용)

```typescript
import { createPipeline, getPipeline } from '@/app/github-actions-flow/constants/mockData';

// 목 데이터로 파이프라인 생성
const result = await createPipeline({
  owner: 'donghyuun',
  repo: 'pipemate',
  workflowName: 'test-workflow',
  inputJson: [...],
  description: '테스트 워크플로우'
});
```

### 실제 API 사용 (프로덕션용)

환경변수 `NEXT_PUBLIC_USE_REAL_API=true`로 설정하면 자동으로 실제 백엔드 API를 사용합니다.

```typescript
// 실제 백엔드 API 호출
const result = await createPipeline({
  owner: 'donghyuun',
  repo: 'pipemate',
  workflowName: 'test-workflow',
  inputJson: [...],
  description: '테스트 워크플로우'
});
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
